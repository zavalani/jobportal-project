package jobportal.exception;

// checked exception, thrown when a candidate applies to the same job twice
public class DuplicateApplicationException extends Exception {
    public DuplicateApplicationException(String message) {
        super(message);
    }
}
