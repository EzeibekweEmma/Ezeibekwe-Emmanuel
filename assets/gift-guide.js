class GiftGuideGrid extends HTMLElement {
  connectedCallback() {
    this.products = this.readProductData();
    this.companionVariantId = this.dataset.companionVariantId || '';
    this.dialog = this.querySelector('[data-gift-guide-dialog]');
    this.activeProduct = null;
    this.activeVariant = null;
    this.lastTrigger = null;

    this.addEventListener('click', this.handleClick);
    this.addEventListener('change', this.handleChange);
    this.dialog?.addEventListener('click', this.handleDialogClick);
    this.dialog?.addEventListener('close', this.restoreFocus);
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.handleClick);
    this.removeEventListener('change', this.handleChange);
    this.dialog?.removeEventListener('click', this.handleDialogClick);
    this.dialog?.removeEventListener('close', this.restoreFocus);
  }

  readProductData() {
    const source = this.querySelector('[data-gift-guide-products]');
    if (!source) return {};

    try {
      return JSON.parse(source.textContent);
    } catch (error) {
      console.error('Gift Guide product data could not be read.', error);
      return {};
    }
  }

  handleClick = (event) => {
    const hotspot = event.target.closest('[data-gift-guide-open]');
    if (hotspot) {
      this.openProduct(hotspot.dataset.productId, hotspot);
      return;
    }

    if (event.target.closest('[data-gift-guide-close]')) {
      this.dialog?.close();
      return;
    }

    if (event.target.closest('[data-gift-guide-add]')) {
      this.addToCart();
    }
  };

  handleDialogClick = (event) => {
    if (event.target === this.dialog) this.dialog.close();
  };

  handleChange = (event) => {
    const control = event.target.closest('[data-option-index]');
    if (!control || !this.activeProduct) return;

    const index = Number(control.dataset.optionIndex);
    const selections = this.getSelections();
    selections[index] = control.value;
    this.activeVariant = this.findVariant(selections);
    this.renderVariantState();
  };

  openProduct(productId, trigger) {
    const product = this.products[productId];
    if (!product || !this.dialog) return;

    this.activeProduct = product;
    this.activeVariant = product.variants.find((variant) => variant.available) || product.variants[0] || null;
    this.lastTrigger = trigger;
    this.renderProduct();
    this.dialog.showModal();
    this.dialog.querySelector('[data-gift-guide-close]')?.focus();
  }

  renderProduct() {
    if (!this.activeProduct || !this.dialog) return;
    const product = this.activeProduct;
    const variant = this.activeVariant;

    const image = this.dialog.querySelector('[data-product-image]');
    image.src = product.image || '';
    image.alt = product.imageAlt || product.title;
    this.dialog.querySelector('[data-product-title]').textContent = product.title;
    this.dialog.querySelector('[data-product-description]').textContent = product.description;
    this.dialog.querySelector('[data-product-options]').replaceChildren(this.createOptionControls());
    this.renderVariantState();
  }

  createOptionControls() {
    const fragment = document.createDocumentFragment();
    const selections = this.activeVariant?.options || [];

    this.activeProduct.options.forEach((optionName, index) => {
      const fieldset = document.createElement('fieldset');
      fieldset.className = 'gift-guide-option';
      const legend = document.createElement('legend');
      legend.className = 'gift-guide-option__label';
      legend.textContent = optionName;
      fieldset.append(legend);

      const values = [...new Set(this.activeProduct.variants.map((variant) => variant.options[index]))];
      const isColour = optionName.toLowerCase() === 'color' || optionName.toLowerCase() === 'colour';

      if (isColour) {
        const choices = document.createElement('div');
        choices.className = 'gift-guide-option__choices';
        values.forEach((value) => {
          const label = document.createElement('label');
          const input = document.createElement('input');
          input.className = 'gift-guide-option__radio';
          input.type = 'radio';
          input.name = `gift-guide-${this.dataset.sectionId}-${index}`;
          input.value = value;
          input.dataset.optionIndex = index;
          input.checked = selections[index] === value;

          const span = document.createElement('span');
          span.className = 'gift-guide-option__choice';
          span.textContent = value;
          label.append(input, span);
          choices.append(label);
        });
        fieldset.append(choices);
      } else {
        const wrap = document.createElement('div');
        wrap.className = 'gift-guide-option__select-wrap';
        const select = document.createElement('select');
        select.className = 'gift-guide-option__select';
        select.dataset.optionIndex = index;
        select.setAttribute('aria-label', optionName);
        values.forEach((value) => {
          const option = document.createElement('option');
          option.value = value;
          option.textContent = value;
          option.selected = selections[index] === value;
          select.append(option);
        });
        wrap.append(select);
        fieldset.append(wrap);
      }

      fragment.append(fieldset);
    });

    return fragment;
  }

  getSelections() {
    return this.activeProduct.options.map((_, index) => {
      const selectedRadio = this.dialog.querySelector(`input[data-option-index="${index}"]:checked`);
      const select = this.dialog.querySelector(`select[data-option-index="${index}"]`);
      return selectedRadio?.value || select?.value || '';
    });
  }

  findVariant(selections) {
    return this.activeProduct.variants.find((variant) =>
      variant.options.every((value, index) => value === selections[index]),
    );
  }

  renderVariantState() {
    if (!this.dialog) return;
    const variant = this.activeVariant;
    const price = this.dialog.querySelector('[data-product-price]');
    const button = this.dialog.querySelector('[data-gift-guide-add]');
    const status = this.dialog.querySelector('[data-gift-guide-status]');

    price.textContent = variant?.priceText || '';
    button.disabled = !variant || !variant.available;
    button.setAttribute('aria-disabled', String(!variant || !variant.available));
    status.textContent = variant && !variant.available ? window.variantStrings?.soldOut || 'Sold out' : '';
  }

  async addToCart() {
    const variant = this.activeVariant;
    const button = this.dialog?.querySelector('[data-gift-guide-add]');
    const status = this.dialog?.querySelector('[data-gift-guide-status]');
    if (!variant || !variant.available || !button) return;

    const variantValues = variant.options.map((value) => value.toLowerCase());
    const includeCompanion = variantValues.includes('black') && variantValues.includes('medium') && this.companionVariantId;
    const items = [{ id: Number(variant.id), quantity: 1 }];
    if (includeCompanion && Number(this.companionVariantId) !== Number(variant.id)) {
      items.push({ id: Number(this.companionVariantId), quantity: 1 });
    }

    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    status.textContent = '';

    try {
      const cart = document.querySelector('cart-drawer, cart-notification');
      const sections = cart?.getSectionsToRender?.().map((section) => section.id).join(',') || '';
      cart?.setActiveElement?.(button);
      const response = await fetch(window.routes.cart_add_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ items, sections, sections_url: window.location.pathname }),
      });
      const data = await response.json();
      if (!response.ok || data.status) throw new Error(data.description || data.message || 'Unable to add this product to your cart.');

      if (typeof publish === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
        publish(PUB_SUB_EVENTS.cartUpdate, {
          source: 'gift-guide',
          productVariantId: variant.id,
          cartData: data,
        });
      }
      cart?.renderContents?.(data);
      this.dialog?.close();
    } catch (error) {
      console.error(error);
      status.textContent = error.message || 'Unable to add this product to your cart.';
    } finally {
      button.removeAttribute('aria-busy');
      button.disabled = !this.activeVariant?.available;
    }
  }

  restoreFocus = () => {
    this.lastTrigger?.focus();
  };
}

if (!customElements.get('gift-guide-grid')) {
  customElements.define('gift-guide-grid', GiftGuideGrid);
}
