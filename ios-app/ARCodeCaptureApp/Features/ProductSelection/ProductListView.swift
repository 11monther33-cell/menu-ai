import SwiftUI

struct ProductListView: View {
    @StateObject private var viewModel: ProductListViewModel
    
    init(appState: AppState) {
        _viewModel = StateObject(wrappedValue: ProductListViewModel(appState: appState))
    }
    
    var body: some View {
        NavigationView {
            VStack {
                if viewModel.isLoading {
                    ProgressView("جاري جلب قائمة المنتجات...")
                } else if let error = viewModel.errorMessage {
                    VStack {
                        Text(error)
                            .foregroundColor(.red)
                            .padding()
                        Button("إعادة المحاولة") {
                            viewModel.fetchProducts()
                        }
                    }
                } else {
                    List(viewModel.filteredProducts) { product in
                        Button(action: {
                            viewModel.selectProduct(product)
                        }) {
                            HStack {
                                // Thumbnail Placeholder
                                RoundedRectangle(cornerRadius: 8)
                                    .fill(Color.gray.opacity(0.3))
                                    .frame(width: 50, height: 50)
                                    .overlay(
                                        Image(systemName: "photo")
                                            .foregroundColor(.gray)
                                    )
                                
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(product.name)
                                        .font(.headline)
                                        .foregroundColor(.primary)
                                    
                                    if product.has3DModel {
                                        Text("يحتوي على نموذج 3D")
                                            .font(.caption)
                                            .padding(.horizontal, 6)
                                            .padding(.vertical, 2)
                                            .background(Color.green.opacity(0.2))
                                            .foregroundColor(.green)
                                            .cornerRadius(4)
                                    } else {
                                        Text("بدون نموذج 3D")
                                            .font(.caption)
                                            .padding(.horizontal, 6)
                                            .padding(.vertical, 2)
                                            .background(Color.orange.opacity(0.2))
                                            .foregroundColor(.orange)
                                            .cornerRadius(4)
                                    }
                                }
                                
                                Spacer()
                                
                                Image(systemName: "chevron.right")
                                    .foregroundColor(.gray)
                            }
                        }
                    }
                    .listStyle(PlainListStyle())
                    .searchable(text: $viewModel.searchQuery, prompt: "بحث عن منتج...")
                }
            }
            .navigationTitle("قائمة المنتجات")
            .navigationBarTitleDisplayMode(.inline)
            .onAppear {
                viewModel.fetchProducts()
            }
        }
    }
}
