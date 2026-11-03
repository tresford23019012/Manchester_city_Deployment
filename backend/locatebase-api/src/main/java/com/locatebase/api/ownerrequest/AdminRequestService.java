package com.locatebase.api.ownerrequest;

import com.locatebase.api.common.BadRequestException;
import com.locatebase.api.common.ConflictException;
import com.locatebase.api.common.NotFoundException;
import com.locatebase.api.common.PageResponse;
import com.locatebase.api.user.AppUser;
import com.locatebase.api.user.AppUserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

@Service
public class AdminRequestService {

    private static final int MAX_PAGE_SIZE = 50;

    private final OwnerRequestRepository requests;
    private final AppUserRepository users;

    public AdminRequestService(OwnerRequestRepository requests, AppUserRepository users) {
        this.requests = requests;
        this.users = users;
    }

    public PageResponse<OwnerRequestResponse> list(String status, int page, int size) {
        if (page < 0) throw new BadRequestException("page must be 0 or greater");
        if (size < 1) throw new BadRequestException("size must be at least 1");
        size = Math.min(size, MAX_PAGE_SIZE);

        Pageable paging = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<OwnerRequest> result = (status == null || status.isBlank())
                ? requests.findAll(paging)
                : requests.findByStatus(parseStatus(status), paging);

        List<OwnerRequestResponse> content = result.getContent().stream().map(OwnerRequestResponse::from).toList();
        return PageResponse.of(content, page, size, result.getTotalElements());
    }

    public OwnerRequestResponse get(String id) {
        return OwnerRequestResponse.from(find(id));
    }

    // Each action only works from the right status, otherwise it is a 409
    public OwnerRequestResponse approve(String id, Jwt jwt) {
        OwnerRequest r = find(id);
        move(r, EnumSet.of(OwnerRequestStatus.PENDING), OwnerRequestStatus.APPROVED,
                "approve", adminName(jwt), "Approved");
        return OwnerRequestResponse.from(requests.save(r));
    }

    public OwnerRequestResponse reject(String id, String reason, Jwt jwt) {
        OwnerRequest r = find(id);
        String why = reason.trim();
        move(r, EnumSet.of(OwnerRequestStatus.PENDING, OwnerRequestStatus.APPROVED), OwnerRequestStatus.REJECTED,
                "reject", adminName(jwt), why);
        r.setRejectReason(why);
        return OwnerRequestResponse.from(requests.save(r));
    }

    public OwnerRequestResponse dispatchRep(String id, DispatchRepRequest in, Jwt jwt) {
        OwnerRequest r = find(id);
        String rep = in.repName().trim();
        move(r, EnumSet.of(OwnerRequestStatus.APPROVED), OwnerRequestStatus.REP_DISPATCHED,
                "dispatch a representative for", adminName(jwt), rep + " will visit on " + in.visitDate());
        r.setRepName(rep);
        r.setVisitDate(in.visitDate().toString());
        return OwnerRequestResponse.from(requests.save(r));
    }

    public OwnerRequestResponse markDataCollected(String id, Jwt jwt) {
        OwnerRequest r = find(id);
        move(r, EnumSet.of(OwnerRequestStatus.REP_DISPATCHED), OwnerRequestStatus.DATA_COLLECTED,
                "mark data collected for", adminName(jwt), "On-site data collected");
        return OwnerRequestResponse.from(requests.save(r));
    }

    // used when an admin creates and publishes a listing

    public OwnerRequest requireExisting(String id) {
        return requests.findById(id)
                .orElseThrow(() -> new BadRequestException("No owner request with that id: " + id));
    }

    // Publishing a listing made from a request needs the on-site data collected first
    public void requireReadyToPublish(String requestId) {
        requests.findById(requestId).ifPresent(r -> {
            if (r.getStatus() != OwnerRequestStatus.DATA_COLLECTED && r.getStatus() != OwnerRequestStatus.PUBLISHED) {
                throw new ConflictException("The owner request must be marked 'data collected' before this "
                        + "guesthouse can be published. It is currently " + r.getStatus().toJson() + ".");
            }
        });
    }

    public void markPublished(String requestId) {
        requests.findById(requestId).ifPresent(r -> {
            if (r.getStatus() != OwnerRequestStatus.PUBLISHED) {
                Instant now = Instant.now();
                r.setStatus(OwnerRequestStatus.PUBLISHED);
                r.setUpdatedAt(now);
                r.getHistory().add(new StatusChange(OwnerRequestStatus.PUBLISHED, now, "system", "Guesthouse published"));
                requests.save(r);
            }
        });
    }

    // HELPERS

    private OwnerRequest find(String id) {
        return requests.findById(id).orElseThrow(() -> new NotFoundException("Request not found: " + id));
    }

    private void move(OwnerRequest r, Set<OwnerRequestStatus> allowedFrom, OwnerRequestStatus to,
                      String action, String by, String note) {
        if (!allowedFrom.contains(r.getStatus())) {
            throw new ConflictException("Cannot " + action + " a request that is " + r.getStatus().toJson() + ".");
        }
        Instant now = Instant.now();
        r.setStatus(to);
        r.setUpdatedAt(now);
        r.getHistory().add(new StatusChange(to, now, by, note));
    }

    private OwnerRequestStatus parseStatus(String status) {
        try {
            return OwnerRequestStatus.fromJson(status);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException(
                    "status must be pending, approved, rejected, rep_dispatched, data_collected or published");
        }
    }

    private String adminName(Jwt jwt) {
        return users.findByFirebaseUid(jwt.getSubject()).map(AppUser::getName).orElse("admin");
    }
}
