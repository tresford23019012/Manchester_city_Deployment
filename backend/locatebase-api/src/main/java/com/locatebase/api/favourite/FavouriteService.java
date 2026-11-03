package com.locatebase.api.favourite;

import com.locatebase.api.common.BadRequestException;
import com.locatebase.api.common.NotFoundException;
import com.locatebase.api.common.PageResponse;
import com.locatebase.api.guesthouse.Guesthouse;
import com.locatebase.api.guesthouse.GuesthouseRepository;
import com.locatebase.api.guesthouse.GuesthouseResponse;
import com.locatebase.api.guesthouse.GuesthouseStatus;
import com.locatebase.api.user.AppUser;
import com.locatebase.api.user.AppUserRepository;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class FavouriteService {

    private static final int MAX_PAGE_SIZE = 50;

    private final FavouriteRepository favourites;
    private final GuesthouseRepository guesthouses;
    private final AppUserRepository users;

    public FavouriteService(FavouriteRepository favourites, GuesthouseRepository guesthouses,
                            AppUserRepository users) {
        this.favourites = favourites;
        this.guesthouses = guesthouses;
        this.users = users;
    }

    // The user's saved guesthouses, newest first, as full guesthouse objects
    public PageResponse<GuesthouseResponse> list(Jwt jwt, int page, int size) {
        if (page < 0) throw new BadRequestException("page must be 0 or greater");
        if (size < 1) throw new BadRequestException("size must be at least 1");
        size = Math.min(size, MAX_PAGE_SIZE);

        AppUser user = currentUser(jwt);
        Page<Favourite> result = favourites.findByUserId(user.getId(),
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));

        List<String> ids = result.getContent().stream().map(Favourite::getGuesthouseId).toList();
        Map<String, Guesthouse> byId = guesthouses.findAllById(ids).stream()
                .collect(Collectors.toMap(Guesthouse::getId, Function.identity()));

        // keep the saved order; a guesthouse that was unpublished or deleted since is skipped
        List<GuesthouseResponse> content = new ArrayList<>();
        for (Favourite f : result.getContent()) {
            Guesthouse g = byId.get(f.getGuesthouseId());
            if (g != null && g.getStatus() == GuesthouseStatus.PUBLISHED) {
                content.add(GuesthouseResponse.from(g));
            }
        }
        return PageResponse.of(content, page, size, result.getTotalElements());
    }

    // Safe to repeat: saving something already saved changes nothing
    public void add(Jwt jwt, String guesthouseId) {
        guesthouses.findById(guesthouseId)
                .filter(g -> g.getStatus() == GuesthouseStatus.PUBLISHED)
                .orElseThrow(() -> new NotFoundException("Guesthouse not found: " + guesthouseId));

        AppUser user = currentUser(jwt);
        if (favourites.existsByUserIdAndGuesthouseId(user.getId(), guesthouseId)) {
            return;
        }
        Favourite f = new Favourite();
        f.setUserId(user.getId());
        f.setGuesthouseId(guesthouseId);
        try {
            favourites.save(f);
        } catch (DuplicateKeyException e) {
            // two identical requests arrived together; the other one already saved it
        }
    }

    // Also safe to repeat: removing something not saved is not an error
    public void remove(Jwt jwt, String guesthouseId) {
        AppUser user = currentUser(jwt);
        favourites.deleteByUserIdAndGuesthouseId(user.getId(), guesthouseId);
    }

    private AppUser currentUser(Jwt jwt) {
        return users.findByFirebaseUid(jwt.getSubject())
                .orElseThrow(() -> new NotFoundException("No profile yet. Call POST /auth/sync after signing in."));
    }
}