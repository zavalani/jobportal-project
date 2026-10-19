package jobportal.service;

import jobportal.entity.Application;
import jobportal.entity.ApplicationStatus;
import jobportal.entity.JobOpening;
import jobportal.entity.User;
import jobportal.exception.DuplicateApplicationException;
import jobportal.exception.ResourceNotFoundException;
import jobportal.repository.ApplicationRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.TreeSet;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@Service
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final UserService userService;
    private final JobService jobService;
    private final JdbcTemplate jdbcTemplate;

    public ApplicationService(ApplicationRepository applicationRepository,
                              UserService userService,
                              JobService jobService,
                              JdbcTemplate jdbcTemplate) {
        this.applicationRepository = applicationRepository;
        this.userService = userService;
        this.jobService = jobService;
        this.jdbcTemplate = jdbcTemplate;
    }

    // candidate applies, uses their email from security context (R10 checked exception)
    public Application apply(Long jobId, String coverLetter, String candidateEmail)
            throws DuplicateApplicationException {
        User candidate = userService.findByEmail(candidateEmail);
        JobOpening job = jobService.findById(jobId);

        if (applicationRepository.existsByCandidateAndJobOpening(candidate, job)) {
            throw new DuplicateApplicationException("you already applied to this job");
        }

        Application app = Application.builder()
                .candidate(candidate)
                .jobOpening(job)
                .coverLetter(coverLetter)
                .build();

        return applicationRepository.save(app);
    }

    // candidate sees their own applications, sorted by date (R4 streams, R1 list)
    public List<Application> findMyApplications(String candidateEmail) {
        User candidate = userService.findByEmail(candidateEmail);
        return applicationRepository.findByCandidate(candidate)
                .stream()
                .sorted((a, b) -> b.getAppliedAt().compareTo(a.getAppliedAt()))
                .collect(Collectors.toList());
    }

    // recruiter sees applicants for their job
    public List<Application> findByJob(Long jobId, String recruiterEmail) {
        JobOpening job = jobService.findById(jobId);
        // make sure the recruiter owns this job
        if (!job.getRecruiter().getEmail().equals(recruiterEmail)) {
            throw new IllegalArgumentException("you can only view applicants for your own jobs");
        }
        return applicationRepository.findByJobOpening(job);
    }

    // update status asynchronously (R5 concurrency)
    @Async
    public CompletableFuture<Application> updateStatusAsync(Long applicationId,
                                                             ApplicationStatus status,
                                                             String recruiterEmail) {
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("application not found: " + applicationId));
        // make sure recruiter owns the job this application belongs to
        if (!app.getJobOpening().getRecruiter().getEmail().equals(recruiterEmail)) {
            throw new IllegalArgumentException("you can only update status for your own job applicants");
        }
        app.setStatus(status);
        return CompletableFuture.completedFuture(applicationRepository.save(app));
    }

    // get distinct statuses using TreeSet (R1 TreeSet)
    public TreeSet<ApplicationStatus> getDistinctStatuses() {
        return applicationRepository.findAll()
                .stream()
                .map(Application::getStatus)
                .collect(Collectors.toCollection(TreeSet::new));
    }

    // raw jdbc query for stats (R6 jdbc)
    public List<Map<String, Object>> getStatusStats() {
        String sql = "SELECT status, COUNT(*) as total FROM applications GROUP BY status";
        return jdbcTemplate.queryForList(sql);
    }

    // audit sees all applications for a candidate by id
    public List<Application> findByCandidate(Long candidateId) {
        User candidate = userService.findById(candidateId);
        return applicationRepository.findByCandidate(candidate);
    }

    public List<Application> findAll() {
        return applicationRepository.findAll();
    }
}
