package jobportal.config;

import java.util.List;
import java.util.function.Predicate;
import java.util.stream.Collectors;

// generic class to filter any list by a predicate (R2 generics requirement)
public class GenericFilter<T> {

    private final List<T> items;

    public GenericFilter(List<T> items) {
        this.items = items;
    }

    public List<T> filter(Predicate<T> predicate) {
        return items.stream()
                .filter(predicate)
                .collect(Collectors.toList());
    }
}
