// ARCodeCaptureApp/Features/ContentView.swift
// شاشة مؤقتة بسيطة - سيتم استبدالها بـ CaptureRootView.swift حسب المواصفة الكاملة
// بمجرد التأكد إن أول بناء ناجح عبر GitHub Actions ووصل TestFlight

import SwiftUI

struct ContentView: View {
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "camera.viewfinder")
                .font(.system(size: 60))
                .foregroundStyle(.blue)

            Text("AR Code Capture")
                .font(.title.bold())

            Text("إصدار تجريبي أولي — نسخة CI Pipeline تعمل بنجاح ✅")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
        }
        .padding()
    }
}

#Preview {
    ContentView()
}
