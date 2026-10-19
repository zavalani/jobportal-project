package jobportal.config;

import jobportal.entity.*;
import jobportal.repository.ApplicationRepository;
import jobportal.repository.JobOpeningRepository;
import jobportal.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner seed(UserRepository userRepo,
                           JobOpeningRepository jobRepo,
                           ApplicationRepository appRepo,
                           PasswordEncoder passwordEncoder) {
        return args -> {
            if (userRepo.count() > 0) return;

            User recruiter = userRepo.save(User.builder()
                    .fullName("Elena Recruiter")
                    .email("recruiter@test.com")
                    .password(passwordEncoder.encode("pass123"))
                    .role(Role.RECRUITER)
                    .active(true)
                    .build());

            User candidate1 = userRepo.save(User.builder()
                    .fullName("Alice Candidate")
                    .email("candidate@test.com")
                    .password(passwordEncoder.encode("pass123"))
                    .role(Role.CANDIDATE)
                    .active(true)
                    .build());

            userRepo.save(User.builder()
                    .fullName("Audit Admin")
                    .email("audit@test.com")
                    .password(passwordEncoder.encode("pass123"))
                    .role(Role.AUDIT)
                    .active(true)
                    .build());

            JobOpening job1 = jobRepo.save(JobOpening.builder()
                    .title("Java Developer")
                    .description("We need a java developer with spring boot experience.")
                    .location("Tirana")
                    .category(JobCategory.ENGINEERING)
                    .recruiter(recruiter)
                    .build());

            jobRepo.save(JobOpening.builder()
                    .title("UX Designer")
                    .description("Looking for a ux designer to join our product team.")
                    .location("Remote")
                    .category(JobCategory.DESIGN)
                    .recruiter(recruiter)
                    .build());

            appRepo.save(Application.builder()
                    .candidate(candidate1)
                    .jobOpening(job1)
                    .coverLetter("I have 3 years of java experience.")
                    .build());
        };
    }
}
