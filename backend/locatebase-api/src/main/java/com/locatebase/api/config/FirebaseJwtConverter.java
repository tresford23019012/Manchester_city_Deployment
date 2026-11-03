package com.locatebase.api.config;

import com.locatebase.api.user.AppUserRepository;
import com.locatebase.api.user.Role;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

// Runs on every request that carries a valid Firebase token.
// It looks the user up in MongoDB and turns their role into permissions.
@Component
public class FirebaseJwtConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private final AppUserRepository users;

    public FirebaseJwtConverter(AppUserRepository users) {
        this.users = users;
    }

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        List<GrantedAuthority> authorities = new ArrayList<>();

        users.findByFirebaseUid(jwt.getSubject()).ifPresent(user -> {
            if (user.isBlocked()) {
                return;   // a blocked user gets no permissions at all
            }
            // roles stack: owner can do what a customer can, admin can do everything
            authorities.add(new SimpleGrantedAuthority("ROLE_CUSTOMER"));
            if (user.getRole() == Role.OWNER || user.getRole() == Role.ADMIN) {
                authorities.add(new SimpleGrantedAuthority("ROLE_OWNER"));
            }
            if (user.getRole() == Role.ADMIN) {
                authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
            }
        });

        return new JwtAuthenticationToken(jwt, authorities);
    }
}