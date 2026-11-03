package com.locatebase.api.dashboard;

import com.locatebase.api.dashboard.DashboardResponses.Snapshot;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

// Server-Sent Events: the admin dashboard keeps one connection open and the server pushes updates to it
@Service
public class DashboardStreamService {

    private static final long TIMEOUT_MS = 30L * 60 * 1000;   // a connection lasts 30 minutes, the app reconnects

    private final DashboardService dashboard;
    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();
    private volatile Snapshot lastSent;

    public DashboardStreamService(DashboardService dashboard) {
        this.dashboard = dashboard;
    }

    public SseEmitter subscribe() {
        SseEmitter emitter = new SseEmitter(TIMEOUT_MS);
        emitters.add(emitter);
        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError(e -> emitters.remove(emitter));
        sendSnapshot(emitter, dashboard.snapshot());   // the first picture, straight away
        return emitter;
    }

    @Scheduled(fixedDelay = 10_000)
    public void broadcast() {
        if (emitters.isEmpty()) {
            return;
        }
        Snapshot now = dashboard.snapshot();
        boolean changed = !now.equals(lastSent);
        lastSent = now;
        for (SseEmitter emitter : emitters) {
            if (changed) {
                sendSnapshot(emitter, now);
            } else {
                try {
                    emitter.send(SseEmitter.event().comment("keep-alive"));
                } catch (IOException e) {
                    emitters.remove(emitter);
                }
            }
        }
    }

    private void sendSnapshot(SseEmitter emitter, Snapshot snapshot) {
        try {
            emitter.send(SseEmitter.event().name("dashboard").data(snapshot, MediaType.APPLICATION_JSON));
        } catch (IOException e) {
            emitters.remove(emitter);
        }
    }
}
