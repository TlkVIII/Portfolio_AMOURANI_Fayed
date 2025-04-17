// Classe pour gérer le panier
class Cart {
    constructor() {
        this.items = JSON.parse(localStorage.getItem('cart')) || [];
        this.updateCartIcon();
        // Vérifier si nous sommes sur la page panier
        if (window.location.pathname.includes('panier.html')) {
            this.updateCartDisplay();
        }
    }

    // Ajouter un produit au panier
    addItem(product) {
        const existingItem = this.items.find(item => 
            item.reference === product.reference
        );

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.items.push({
                ...product,
                quantity: 1
            });
        }

        this.saveCart();
        this.updateCartIcon();
        // Mettre à jour l'affichage si nous sommes sur la page panier
        if (window.location.pathname.includes('panier.html')) {
            this.updateCartDisplay();
        }
        this.showNotification('Produit ajouté au panier');
    }

    // Retirer un produit du panier
    removeItem(reference) {
        const itemElement = document.querySelector(`[data-reference="${reference}"]`);
        if (itemElement) {
            itemElement.classList.add('removing');
            setTimeout(() => {
                this.items = this.items.filter(item => item.reference !== reference);
                this.saveCart();
                this.updateCartIcon();
                if (window.location.pathname.includes('panier.html')) {
                    this.updateCartDisplay();
                }
                this.showNotification('Produit retiré du panier');
            }, 300);
        }
    }

    // Modifier la quantité d'un produit
    updateQuantity(reference, quantity) {
        const item = this.items.find(item => item.reference === reference);
        if (item) {
            const newQuantity = parseInt(quantity);
            if (newQuantity <= 0) {
                // Si la quantité est 0 ou négative, supprimer l'article
                this.removeItem(reference);
            } else {
                item.quantity = newQuantity;
                this.saveCart();
                this.updateCartIcon();
                if (window.location.pathname.includes('panier.html')) {
                    this.updateCartDisplay();
                }
            }
        }
    }

    // Calculer le total du panier
    getTotal() {
        return this.items.reduce((total, item) => 
            total + (parseFloat(item.price) * item.quantity), 0
        ).toFixed(2);
    }

    // Sauvegarder le panier dans le localStorage
    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.items));
    }

    // Mettre à jour l'icône du panier
    updateCartIcon() {
        const cartCount = document.querySelector('.cart-icon span');
        if (cartCount) {
            const totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
            cartCount.textContent = totalItems;
        }
    }

    // Mettre à jour l'affichage du panier
    updateCartDisplay() {
        const cartItemsContainer = document.querySelector('.cart-items');
        if (!cartItemsContainer) return; // Si on n'est pas sur la page panier

        if (this.items.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Votre panier est vide</p>
                    <a href="/index.html" class="continue-shopping">Continuer vos achats</a>
                </div>
            `;
            this.updateSummary(0);
            return;
        }

        cartItemsContainer.innerHTML = this.items.map(item => `
            <div class="cart-item" data-reference="${item.reference}">
                <img src="${item.image}" alt="${item.name}">
                <div class="item-details">
                    <h3>${item.name}</h3>
                    <p class="item-reference">RÉF: ${item.reference}</p>
                    <p class="item-price">€${item.price}</p>
                </div>
                <div class="quantity-controls">
                    <button class="quantity-btn minus">-</button>
                    <input type="number" value="${item.quantity}" min="1" class="quantity-input">
                    <button class="quantity-btn plus">+</button>
                </div>
                <button class="remove-item">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');

        this.updateSummary(this.getTotal());
        this.addCartEventListeners();
    }

    // Mettre à jour le résumé du panier
    updateSummary(subtotal) {
        const summaryContainer = document.querySelector('.cart-summary');
        if (!summaryContainer) return;

        const shipping = subtotal > 0 ? 4.99 : 0;
        const total = (parseFloat(subtotal) + shipping).toFixed(2);

        document.querySelector('.subtotal .amount').textContent = `€${subtotal}`;
        document.querySelector('.shipping .amount').textContent = shipping > 0 ? `€${shipping.toFixed(2)}` : 'Gratuit';
        document.querySelector('.total .amount').textContent = `€${total}`;
    }

    // Ajouter les écouteurs d'événements
    addCartEventListeners() {
        // Gérer les boutons plus/moins
        document.querySelectorAll('.quantity-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const item = e.target.closest('.cart-item');
                const reference = item.dataset.reference;
                const input = item.querySelector('.quantity-input');
                const currentValue = parseInt(input.value);

                if (e.target.classList.contains('plus')) {
                    this.updateQuantity(reference, currentValue + 1);
                } else if (e.target.classList.contains('minus')) {
                    this.updateQuantity(reference, currentValue - 1);
                }
            });
        });

        // Gérer les inputs de quantité
        document.querySelectorAll('.quantity-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const item = e.target.closest('.cart-item');
                const reference = item.dataset.reference;
                this.updateQuantity(reference, Math.max(1, e.target.value));
            });
        });

        // Gérer les boutons de suppression
        document.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const item = e.target.closest('.cart-item');
                const reference = item.dataset.reference;
                this.removeItem(reference);
            });
        });
    }

    // Afficher une notification
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'cart-notification';
        notification.innerHTML = `
            <i class="fas ${message.includes('ajouté') ? 'fa-check-circle' : 'fa-times-circle'}"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 2000);
    }

    // Modifier la méthode showSuggestions dans la classe Cart
    showSuggestions() {
        const suggestionsContainer = document.querySelector('.suggestions-grid');
        if (!suggestionsContainer) return;

        // Obtenir les références des produits dans le panier
        const cartReferences = this.items.map(item => item.reference);

        // Liste des produits de la page papeterie
        const allProducts = [
            {
                name: "Stylo à bille BIC",
                reference: "STY001",
                price: "1.50",
                image: "/Images/products/stylo.jpg"
            },
            {
                name: "Crayon à papier",
                reference: "CRA001",
                price: "0.80",
                image: "/Images/products/crayon.jpg"
            },
            {
                name: "Gomme blanche",
                reference: "GOM001",
                price: "0.50",
                image: "/Images/products/gomme.jpg"
            },
        ];

        // Liste des produits de la page bureautique
        const bureautiqueProducts = [
            {
                name: "Ordinateur portable",
                reference: "ORD001",
                price: "799.99",
                image: "/Images/products/ordinateur.jpg"
            },
            {
                name: "Clavier sans fil",
                reference: "CLA001",
                price: "29.99",
                image: "/Images/products/clavier.jpg"
            },
            {
                name: "Souris optique",
                reference: "SOU001",
                price: "19.99",
                image: "/Images/products/souris.jpg"
            }
        ];

        // Filtrer les produits qui ne sont pas dans le panier
        const suggestions = [...allProducts, ...bureautiqueProducts]
            .filter(product => !cartReferences.includes(product.reference))
            .sort(() => 0.5 - Math.random()) // Mélanger les suggestions
            .slice(0, 4); // Limiter à 4 suggestions

        // Afficher les suggestions
        suggestionsContainer.innerHTML = suggestions.map(product => `
            <div class="suggestion-card">
                <img src="${product.image}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p class="price">€${product.price}</p>
                <button class="add-to-cart" data-reference="${product.reference}">
                    Ajouter au panier
                    <i class="fas fa-shopping-cart"></i>
                </button>
            </div>
        `).join('');

        // Ajouter les écouteurs d'événements pour les boutons d'ajout au panier
        suggestionsContainer.querySelectorAll('.add-to-cart').forEach(button => {
            button.addEventListener('click', (e) => {
                const reference = e.target.dataset.reference;
                const product = suggestions.find(p => p.reference === reference);
                if (product) {
                    this.addItem(product);
                }
            });
        });
    }
}

// Initialiser le panier
const cart = new Cart();

// Ajouter les écouteurs d'événements aux boutons "Ajouter au panier"
document.addEventListener('DOMContentLoaded', () => {
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    
    addToCartButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const productCard = e.target.closest('.product-card');
            const product = {
                name: productCard.querySelector('h3').textContent,
                reference: productCard.querySelector('.product-reference').textContent.split(': ')[1],
                price: productCard.querySelector('.price').textContent.replace('€', ''),
                image: productCard.querySelector('img').src
            };
            cart.addItem(product);
        });
    });
});
