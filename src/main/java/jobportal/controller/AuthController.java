package jobportal.controller;

import jobportal.entity.Role;
import jobportal.entity.User;
import jobportal.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserService userService;
    private final AuthenticationManager authenticationManager;

    public AuthController(UserService userService, AuthenticationManager authenticationManager) {
        this.userService = userService;
        this.authenticationManager = authenticationManager;
    }

    // login, returns the user info so frontend knows the role
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");

        try {
            Authentication auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, password)
            );
            SecurityContextHolder.getContext().setAuthentication(auth);
            User user = userService.findByEmail(email);
            return ResponseEntity.ok(user);
        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "invalid email or password"));
        }
    }

    // register as candidate
    @PostMapping("/register/candidate")
    public ResponseEntity<User> registerCandidate(@RequestBody User user) {
        user.setRole(Role.CANDIDATE);
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.register(user));
    }

    // register as recruiter
    @PostMapping("/register/recruiter")
    public ResponseEntity<User> registerRecruiter(@RequestBody User user) {
        user.setRole(Role.RECRUITER);
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.register(user));
    }
}
