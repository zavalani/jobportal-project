package jobportal.controller;

import jobportal.entity.Application;
import jobportal.entity.ApplicationStatus;
import jobportal.entity.JobOpening;
import jobportal.entity.User;
import jobportal.service.ApplicationService;
import jobportal.service.JobService;
import jobportal.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/recruiter")
@CrossOrigin(origins = "*")
public class RecruiterController {

    private final JobService jobService;
    private final ApplicationService applicationService;
    private final UserService userService;

    public RecruiterController(JobService jobService,
                                ApplicationService applicationService,
                                UserService userService) {
        this.jobService = jobService;
        this.applicationService = applicationService;
        this.userService = userService;
    }

    // get own profile
    @GetMapping("/me")
    public ResponseEntity<User> me(@AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(userService.findByEmail(principal.getUsername()));
    }

    // create a job, recruiter is taken from the security token
    @PostMapping("/jobs")
    public ResponseEntity<JobOpening> createJob(@RequestBody JobOpening job,
                                                 @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(jobService.create(job, principal.getUsername()));
    }

    // only returns jobs belonging to this recruiter
    @GetMapping("/jobs")
    public ResponseEntity<List<JobOpening>> myJobs(@AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(jobService.findMyJobs(principal.getUsername()));
    }

    // update a job, service checks ownership
    @PutMapping("/jobs/{id}")
    public ResponseEntity<JobOpening> updateJob(@PathVariable Long id,
                                                 @RequestBody JobOpening updated,
                                                 @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(jobService.update(id, updated, principal.getUsername()));
    }

    // soft delete, service checks ownership
    @DeleteMapping("/jobs/{id}")
    public ResponseEntity<Void> deleteJob(@PathVariable Long id,
                                           @AuthenticationPrincipal UserDetails principal) {
        jobService.softDelete(id, principal.getUsername());
        return ResponseEntity.noContent().build();
    }

    // view applicants for a job, service checks ownership
    @GetMapping("/jobs/{jobId}/applicants")
    public ResponseEntity<List<Application>> getApplicants(@PathVariable Long jobId,
                                                            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(applicationService.findByJob(jobId, principal.getUsername()));
    }

    // update application status async (R5 concurrency)
    @PatchMapping("/applications/{id}/status")
    public CompletableFuture<ResponseEntity<Application>> updateStatus(
            @PathVariable Long id,
            @RequestParam ApplicationStatus status,
            @AuthenticationPrincipal UserDetails principal) {
        return applicationService.updateStatusAsync(id, status, principal.getUsername())
                .thenApply(ResponseEntity::ok);
    }
}
