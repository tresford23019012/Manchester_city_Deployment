package com.locatebase.api.contact;

import com.locatebase.api.common.BadRequestException;
import com.locatebase.api.common.NotFoundException;
import com.locatebase.api.common.PageResponse;
import com.locatebase.api.user.AppUser;
import com.locatebase.api.user.AppUserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ContactService {

    private static final int MAX_PAGE_SIZE = 50;
    private static final List<String> STATUSES = List.of("new", "resolved");

    private final ContactMessageRepository messages;
    private final AppUserRepository users;

    public ContactService(ContactMessageRepository messages, AppUserRepository users) {
        this.messages = messages;
        this.users = users;
    }

    // ---------- any logged-in user ----------

    public ContactMessageResponse send(Jwt jwt, ContactRequest request) {
        AppUser user = users.findByFirebaseUid(jwt.getSubject())
                .orElseThrow(() -> new NotFoundException("No profile yet. Call POST /auth/sync after signing in."));

        ContactMessage m = new ContactMessage();
        m.setUserId(user.getId());
        m.setUserName(user.getName());
        m.setUserEmail(user.getEmail());
        m.setSubject(request.subject().trim());
        m.setMessage(request.message().trim());

        return ContactMessageResponse.from(messages.save(m));
    }

    // ---------- admins only ----------

    public PageResponse<AdminContactMessageResponse> list(String status, int page, int size) {
        if (page < 0) throw new BadRequestException("page must be 0 or greater");
        if (size < 1) throw new BadRequestException("size must be at least 1");
        size = Math.min(size, MAX_PAGE_SIZE);

        PageRequest paging = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));   // newest first

        Page<ContactMessage> result;
        if (status == null || status.isBlank()) {
            result = messages.findAll(paging);
        } else {
            result = messages.findByStatus(checkStatus(status), paging);
        }

        List<AdminContactMessageResponse> content = result.getContent().stream()
                .map(AdminContactMessageResponse::from)
                .toList();
        return PageResponse.of(content, page, size, result.getTotalElements());
    }

    public AdminContactMessageResponse updateStatus(String id, String status) {
        ContactMessage m = messages.findById(id)
                .orElseThrow(() -> new NotFoundException("Message not found: " + id));
        m.setStatus(checkStatus(status));
        return AdminContactMessageResponse.from(messages.save(m));
    }

    // only "new" and "resolved" are allowed
    private String checkStatus(String status) {
        String s = status.trim().toLowerCase();
        if (!STATUSES.contains(s)) {
            throw new BadRequestException("status must be 'new' or 'resolved'");
        }
        return s;
    }
}