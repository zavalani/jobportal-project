package jobportal.controller;

import jobportal.entity.Application;
import jobportal.entity.JobOpening;
import jobportal.entity.Role;
import jobportal.entity.User;
import jobportal.service.ApplicationService;
import jobportal.service.JobService;
import jobportal.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/audit")
@CrossOrigin(origins = "*")
public class AuditController {

    private final UserService userService;
    private final JobService jobService;
    private final ApplicationService applicationService;

    public AuditController(UserService userService,
                            JobService jobService,
                            ApplicationService applicationService) {
        this.userService = userService;
        this.jobService = jobService;
        this.applicationService = applicationService;
    }

    @GetMapping("/candidates")
    public ResponseEntity<List<User>> getCandidates() {
        return ResponseEntity.ok(userService.findByRole(Role.CANDIDATE));
    }

    @GetMapping("/recruiters")
    public ResponseEntity<List<User>> getRecruiters() {
        return ResponseEntity.ok(userService.findByRole(Role.RECRUITER));
    }

    @GetMapping("/jobs")
    public ResponseEntity<List<JobOpening>> getAllJobs() {
        return ResponseEntity.ok(jobService.findAll());
    }

    // candidate application history by id
    @GetMapping("/candidates/{id}/history")
    public ResponseEntity<List<Application>> getCandidateHistory(@PathVariable Long id) {
        return ResponseEntity.ok(applicationService.findByCandidate(id));
    }

    // crud on users
    @PostMapping("/users")
    public ResponseEntity<User> createUser(@RequestBody User user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.register(user));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody User updated) {
        return ResponseEntity.ok(userService.update(id, updated));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<User> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.findById(id));
    }

    // application stats via raw jdbc (R6)
    @GetMapping("/stats")
    public ResponseEntity<List<Map<String, Object>>> getStats() {
        return ResponseEntity.ok(applicationService.getStatusStats());
    }

    // jobs grouped by category (R1 HashMap, R4 streams)
    @GetMapping("/jobs/by-category")
    public ResponseEntity<Map<String, Long>> jobsByCategory() {
        return ResponseEntity.ok(jobService.countByCategory());
    }
}
