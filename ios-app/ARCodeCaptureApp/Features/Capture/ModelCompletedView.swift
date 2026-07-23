import SwiftUI
import SceneKit
import QuickLook

struct ModelCompletedView: View {
    @ObservedObject var appState: AppState
    let modelURL: URL
    @State private var showARQuickLook = false
    @State private var showShareSheet = false
    
    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Button(action: {
                    appState.currentFlowState = .selectingProduct
                    appState.selectedProductId = nil
                }) {
                    Image(systemName: "chevron.right")
                        .font(.title2)
                        .foregroundColor(.blue)
                }
                
                Spacer()
                
                Text("المجسم ثلاثي الأبعاد")
                    .font(.headline)
                
                Spacer()
                
                // Share button
                Button(action: {
                    showShareSheet = true
                }) {
                    Image(systemName: "square.and.arrow.up")
                        .font(.title2)
                        .foregroundColor(.blue)
                }
            }
            .padding()
            
            // 3D Model Viewer using SceneKit
            SceneView3D(modelURL: modelURL)
                .frame(maxWidth: .infinity)
                .frame(height: 400)
                .background(Color.black.opacity(0.05))
                .cornerRadius(20)
                .padding(.horizontal)
            
            // Info section
            VStack(spacing: 16) {
                HStack {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.green)
                        .font(.title2)
                    Text("تم إنشاء المجسم بنجاح!")
                        .font(.headline)
                }
                
                // File info
                if let fileSize = getFileSize(url: modelURL) {
                    HStack {
                        Image(systemName: "doc.fill")
                            .foregroundColor(.gray)
                        Text("حجم الملف: \(fileSize)")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                }
                
                Text("الملف محفوظ في: \(modelURL.lastPathComponent)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding()
            
            Spacer()
            
            // Action buttons
            VStack(spacing: 12) {
                // View in AR button
                Button(action: {
                    showARQuickLook = true
                }) {
                    HStack {
                        Image(systemName: "arkit")
                        Text("مشاهدة في الواقع المعزز (AR)")
                    }
                    .fontWeight(.bold)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(12)
                }
                
                // Back to products
                Button(action: {
                    appState.currentFlowState = .selectingProduct
                    appState.selectedProductId = nil
                }) {
                    Text("تصوير منتج آخر")
                        .fontWeight(.semibold)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.gray.opacity(0.2))
                        .foregroundColor(.primary)
                        .cornerRadius(12)
                }
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 30)
        }
        .quickLookPreview($showARQuickLook, items: [modelURL])
        .sheet(isPresented: $showShareSheet) {
            ActivityViewController(activityItems: [modelURL])
        }
    }
    
    private func getFileSize(url: URL) -> String? {
        guard let attributes = try? FileManager.default.attributesOfItem(atPath: url.path),
              let fileSize = attributes[.size] as? Int64 else {
            return nil
        }
        let formatter = ByteCountFormatter()
        formatter.allowedUnits = [.useMB, .useKB]
        formatter.countStyle = .file
        return formatter.string(fromByteCount: fileSize)
    }
}

// MARK: - 3D Scene Viewer using SceneKit
struct SceneView3D: UIViewRepresentable {
    let modelURL: URL
    
    func makeUIView(context: Context) -> SCNView {
        let sceneView = SCNView()
        sceneView.autoenablesDefaultLighting = true
        sceneView.allowsCameraControl = true // Enable rotate/zoom/pan with gestures
        sceneView.backgroundColor = UIColor.systemBackground
        sceneView.antialiasingMode = .multisampling4X
        
        // Load the USDZ model
        if let scene = try? SCNScene(url: modelURL) {
            sceneView.scene = scene
            
            // Add a camera
            let cameraNode = SCNNode()
            cameraNode.camera = SCNCamera()
            cameraNode.position = SCNVector3(x: 0, y: 0.2, z: 0.5)
            cameraNode.look(at: SCNVector3(x: 0, y: 0, z: 0))
            scene.rootNode.addChildNode(cameraNode)
        }
        
        return sceneView
    }
    
    func updateUIView(_ uiView: SCNView, context: Context) {}
}

// MARK: - QuickLook Preview for AR
extension View {
    func quickLookPreview(_ isPresented: Binding<Bool>, items: [URL]) -> some View {
        self.fullScreenCover(isPresented: isPresented) {
            QuickLookPreviewController(url: items.first!)
                .edgesIgnoringSafeArea(.all)
        }
    }
}

struct QuickLookPreviewController: UIViewControllerRepresentable {
    let url: URL
    
    func makeUIViewController(context: Context) -> QLPreviewController {
        let controller = QLPreviewController()
        controller.dataSource = context.coordinator
        return controller
    }
    
    func updateUIViewController(_ uiViewController: QLPreviewController, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(url: url)
    }
    
    class Coordinator: NSObject, QLPreviewControllerDataSource {
        let url: URL
        
        init(url: URL) {
            self.url = url
        }
        
        func numberOfPreviewItems(in controller: QLPreviewController) -> Int { 1 }
        
        func previewController(_ controller: QLPreviewController, previewItemAt index: Int) -> QLPreviewItem {
            url as QLPreviewItem
        }
    }
}

// MARK: - Share Sheet
struct ActivityViewController: UIViewControllerRepresentable {
    let activityItems: [Any]
    
    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: activityItems, applicationActivities: nil)
    }
    
    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}
