package jobportal.controller;

import jobportal.entity.Application;
import jobportal.entity.JobCategory;
import jobportal.entity.JobOpening;
import jobportal.entity.User;
import jobportal.exception.DuplicateApplicationException;
import jobportal.service.ApplicationService;
import jobportal.service.JobService;
import jobportal.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/candidate")
@CrossOrigin(origins = "*")
public class CandidateController {

    private final JobService jobService;
    private final ApplicationService applicationService;
    private final UserService userService;

    public CandidateController(JobService jobService,
                                ApplicationService applicationService,
                                UserService userService) {
        this.jobService = jobService;
        this.applicationService = applicationService;
        this.userService = userService;
    }

    // view all active jobs
    @GetMapping("/jobs")
    public ResponseEntity<List<JobOpening>> getAllJobs() {
        return ResponseEntity.ok(jobService.findAllActive());
    }

    // filter jobs by category
    @GetMapping("/jobs/filter")
    public ResponseEntity<List<JobOpening>> filterJobs(@RequestParam JobCategory category) {
        return ResponseEntity.ok(jobService.filterByCategory(category));
    }

    // apply to a job, candidate email comes from the security token not the request
    @PostMapping("/apply")
    public ResponseEntity<?> apply(@RequestBody Map<String, Object> body,
                                    @AuthenticationPrincipal UserDetails principal) {
        try {
            Long jobId = Long.valueOf(body.get("jobId").toString());
            String coverLetter = body.getOrDefault("coverLetter", "").toString();
            Application app = applicationService.apply(jobId, coverLetter, principal.getUsername());
            return ResponseEntity.status(HttpStatus.CREATED).body(app);
        } catch (DuplicateApplicationException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
        }
    }

    // candidate sees only their own applications
    @GetMapping("/applications")
    public ResponseEntity<List<Application>> myApplications(
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(applicationService.findMyApplications(principal.getUsername()));
    }

    // get own profile
    @GetMapping("/me")
    public ResponseEntity<User> me(@AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(userService.findByEmail(principal.getUsername()));
    }
}
