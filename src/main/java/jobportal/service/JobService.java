package jobportal.service;

import jobportal.config.GenericFilter;
import jobportal.entity.JobCategory;
import jobportal.entity.JobOpening;
import jobportal.entity.User;
import jobportal.exception.ResourceNotFoundException;
import jobportal.repository.JobOpeningRepository;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class JobService {

    private final JobOpeningRepository jobOpeningRepository;
    private final UserService userService;

    public JobService(JobOpeningRepository jobOpeningRepository, UserService userService) {
        this.jobOpeningRepository = jobOpeningRepository;
        this.userService = userService;
    }

    public JobOpening create(JobOpening job, String recruiterEmail) {
        User recruiter = userService.findByEmail(recruiterEmail);
        job.setRecruiter(recruiter);
        return jobOpeningRepository.save(job);
    }

    public JobOpening findById(Long id) {
        return jobOpeningRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("job not found: " + id));
    }

    public List<JobOpening> findAllActive() {
        return jobOpeningRepository.findByIsDeletedFalse();
    }

    // filter by category using generic filter class (R2, R3)
    public List<JobOpening> filterByCategory(JobCategory category) {
        List<JobOpening> all = jobOpeningRepository.findByIsDeletedFalse();
        GenericFilter<JobOpening> filter = new GenericFilter<>(all);
        return filter.filter(job -> job.getCategory() == category);
    }

    // returns only the jobs belonging to the logged in recruiter
    public List<JobOpening> findMyJobs(String recruiterEmail) {
        User recruiter = userService.findByEmail(recruiterEmail);
        return jobOpeningRepository.findByRecruiter(recruiter);
    }

    public void softDelete(Long id, String recruiterEmail) {
        JobOpening job = findById(id);
        User recruiter = userService.findByEmail(recruiterEmail);
        // make sure the recruiter owns this job
        if (!job.getRecruiter().getId().equals(recruiter.getId())) {
            throw new IllegalArgumentException("you can only delete your own jobs");
        }
        job.setDeleted(true);
        jobOpeningRepository.save(job);
    }

    public JobOpening update(Long id, JobOpening updated, String recruiterEmail) {
        JobOpening job = findById(id);
        User recruiter = userService.findByEmail(recruiterEmail);
        if (!job.getRecruiter().getId().equals(recruiter.getId())) {
            throw new IllegalArgumentException("you can only update your own jobs");
        }
        job.setTitle(updated.getTitle());
        job.setDescription(updated.getDescription());
        job.setLocation(updated.getLocation());
        job.setCategory(updated.getCategory());
        return jobOpeningRepository.save(job);
    }

    // count jobs per category, used in audit stats (R1 HashMap, R4 streams)
    public Map<String, Long> countByCategory() {
        List<JobOpening> jobs = jobOpeningRepository.findByIsDeletedFalse();
        Map<String, Long> result = new HashMap<>();
        jobs.stream()
                .collect(Collectors.groupingBy(j -> j.getCategory().name(), Collectors.counting()))
                .forEach(result::put);
        return result;
    }

    public List<JobOpening> findAll() {
        return jobOpeningRepository.findAll();
    }
}
