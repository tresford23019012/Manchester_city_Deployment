package com.locatebase.api.user;

import com.locatebase.api.common.BadRequestException;
import com.locatebase.api.common.ConflictException;
import com.locatebase.api.common.NotFoundException;
import com.locatebase.api.common.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

@Service
public class AdminUserService {

    private static final int MAX_PAGE_SIZE = 50;

    private final AppUserRepository users;
    private final MongoTemplate mongo;

    public AdminUserService(AppUserRepository users, MongoTemplate mongo) {
        this.users = users;
        this.mongo = mongo;
    }

    public PageResponse<AdminUserResponse> list(String role, String search, int page, int size) {
        if (page < 0) throw new BadRequestException("page must be 0 or greater");
        if (size < 1) throw new BadRequestException("size must be at least 1");
        size = Math.min(size, MAX_PAGE_SIZE);

        List<Criteria> filters = new ArrayList<>();
        if (role != null && !role.isBlank()) {
            filters.add(Criteria.where("role").is(parseRole(role).name()));
        }
        if (search != null && !search.isBlank()) {
            String literal = Pattern.quote(search.trim());   // plain text, never a query pattern
            filters.add(new Criteria().orOperator(
                    Criteria.where("name").regex(literal, "i"),
                    Criteria.where("email").regex(literal, "i")));
        }

        Query query = filters.isEmpty() ? new Query() : new Query(new Criteria().andOperator(filters));
        long total = mongo.count(query, AppUser.class);

        query.with(PageRequest.of(page, size,
                Sort.by(Sort.Direction.DESC, "createdAt").and(Sort.by(Sort.Direction.ASC, "id"))));
        List<AdminUserResponse> content = mongo.find(query, AppUser.class).stream()
                .map(AdminUserResponse::from)
                .toList();
        return PageResponse.of(content, page, size, total);
    }

    public AdminUserResponse get(String id) {
        return AdminUserResponse.from(find(id));
    }

    // Admins cannot be blocked, so nobody can lock the staff out
    public AdminUserResponse setBlocked(String id, boolean blocked) {
        AppUser user = find(id);
        if (user.getRole() == Role.ADMIN) {
            throw new BadRequestException("Admins cannot be blocked.");
        }
        user.setBlocked(blocked);
        user.setUpdatedAt(Instant.now());
        return AdminUserResponse.from(users.save(user));
    }

    // Makes an existing user an admin. They must already have signed up in the app.
    public AdminUserResponse makeAdmin(String email) {
        AppUser user = users.findByEmailIgnoreCase(email.trim())
                .orElseThrow(() -> new BadRequestException("No user with that email. They must sign up in the app first."));
        if (user.getRole() == Role.ADMIN) {
            throw new ConflictException("That user is already an admin.");
        }
        user.setRole(Role.ADMIN);
        user.setBlocked(false);
        user.setUpdatedAt(Instant.now());
        return AdminUserResponse.from(users.save(user));
    }

    private AppUser find(String id) {
        return users.findById(id).orElseThrow(() -> new NotFoundException("User not found: " + id));
    }

    private Role parseRole(String role) {
        try {
            return Role.fromJson(role);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("role must be customer, owner or admin");
        }
    }
}
