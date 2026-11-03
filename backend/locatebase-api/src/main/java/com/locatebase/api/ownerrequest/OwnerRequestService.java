package com.locatebase.api.ownerrequest;

import com.locatebase.api.common.BadRequestException;
import com.locatebase.api.common.ConflictException;
import com.locatebase.api.common.NotFoundException;
import com.locatebase.api.common.PageResponse;
import com.locatebase.api.user.AppUser;
import com.locatebase.api.user.AppUserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class OwnerRequestService {

    private static final int MAX_PAGE_SIZE = 50;
    private static final int MAX_PENDING_PER_OWNER = 5;

    private final OwnerRequestRepository requests;
    private final AppUserRepository users;

    public OwnerRequestService(OwnerRequestRepository requests, AppUserRepository users) {
        this.requests = requests;
        this.users = users;
    }

    // OWNERS SIDE

    public OwnerRequestResponse create(Jwt jwt, OwnerRequestInput in) {
        AppUser owner = currentUser(jwt);

        // stops someone flooding the admins with requests
        if (requests.countByOwnerIdAndStatus(owner.getId(), OwnerRequestStatus.PENDING) >= MAX_PENDING_PER_OWNER) {
            throw new ConflictException("You already have " + MAX_PENDING_PER_OWNER
                    + " requests waiting for review. Please wait for a decision.");
        }

        OwnerRequest r = new OwnerRequest();
        r.setOwnerId(owner.getId());
        r.setOwnerName(owner.getName());
        r.setOwnerEmail(owner.getEmail());
        r.setGuesthouseName(in.guesthouseName().trim());
        r.setCity(in.city().trim());
        r.setAddress(clean(in.address()));
        r.setPhone(in.phone().trim());
        r.setPricePerNight(in.pricePerNight());
        r.setDescription(clean(in.description()));
        r.setNotes(clean(in.notes()));
        r.getHistory().add(new StatusChange(OwnerRequestStatus.PENDING, Instant.now(), owner.getName(),
                "Request submitted"));
        return OwnerRequestResponse.from(requests.save(r));
    }

    // my requests, newest first
    public PageResponse<OwnerRequestResponse> listMine(Jwt jwt, int page, int size) {
        if (page < 0) throw new BadRequestException("page must be 0 or greater");
        if (size < 1) throw new BadRequestException("size must be at least 1");
        size = Math.min(size, MAX_PAGE_SIZE);

        AppUser owner = currentUser(jwt);
        Page<OwnerRequest> result = requests.findByOwnerId(owner.getId(),
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));

        List<OwnerRequestResponse> content = result.getContent().stream().map(OwnerRequestResponse::from).toList();
        return PageResponse.of(content, page, size, result.getTotalElements());
    }

    // someone else's request looks like "not found"
    public OwnerRequestResponse getMine(Jwt jwt, String id) {
        AppUser owner = currentUser(jwt);
        OwnerRequest r = requests.findByIdAndOwnerId(id, owner.getId())
                .orElseThrow(() -> new NotFoundException("Request not found: " + id));
        return OwnerRequestResponse.from(r);
    }

    // HELPERS

    private AppUser currentUser(Jwt jwt) {
        return users.findByFirebaseUid(jwt.getSubject())
                .orElseThrow(() -> new NotFoundException("No profile yet. Call POST /auth/sync after signing in."));
    }

    private String clean(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }
}