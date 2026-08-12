class GiftGuideGrid extends HTMLElement {
  constructor() {
    super();
    this.handleClick = this.handleClick.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleDialogClick = this.handleDialogClick.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);
    this.restoreFocus = this.restoreFocus.bind(this);
  }

  connectedCallback() {
    this.products = this.readProductData();
    this.companionVariantId = this.dataset.companionVariantId || '';
    this.dialog = this.querySelector('[data-gift-guide-dialog]');
    this.activeProduct = null;
    this.activeVariant = null;
    this.selections = [];
    this.lastTrigger = null;

    this.addEventListener('click', this.handleClick);
    this.addEventListener('change', this.handleChange);
    this.dialog?.addEventListener('click', this.handleDialogClick);
    this.dialog?.addEventListener('close', this.restoreFocus);
    document.addEventListener('keydown', this.handleKeydown);
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.handleClick);
    this.removeEventListener('change', this.handleChange);
    this.dialog?.removeEventListener('click', this.handleDialogClick);
    this.dialog?.removeEventListener('close', this.restoreFocus);
    document.removeEventListener('keydown', this.handleKeydown);
  }

  readProductData() {
    const source = this.querySelector('[data-gift-guide-products]');
    if (!source) return {};

    try {
      return JSON.parse(source.textContent.trim() || '{}');
    } catch (error) {
      console.error('Gift Guide product data could not be read.', error);
      return {};
    }
  }

  handleClick(event) {
    const hotspot = event.target.closest('[data-gift-guide-open]');
    if (hotspot) {
      this.openProduct(hotspot.dataset.productId, hotspot);
      return;
    }

    if (event.target.closest('[data-gift-guide-close]')) {
      this.closeDialog();
      return;
    }

    if (event.target.closest('[data-gift-guide-add]')) this.addToCart();
  }

  handleDialogClick(event) {
    if (event.target === this.dialog) this.closeDialog();
  }

  handleKeydown(event) {
    if (event.key === 'Escape' && this.dialog?.classList.contains('is-fallback-open')) {
      this.closeDialog();
    }
  }

  handleChange(event) {
    const control = event.target.closest('[data-option-index]');
    if (!control || !this.activeProduct) return;

    this.selections[Number(control.dataset.optionIndex)] = control.value;
    this.activeVariant = this.findVariant(this.selections);
    this.dialog.querySelector('[data-gift-guide-add-label]').textContent = 'Add to cart';
    this.renderVariantState();
  }

  openProduct(productId, trigger) {
    const product = this.products[String(productId)];
    if (!product || !this.dialog) return;

    const initialVariant = product.variants.find((variant) => variant.available) || product.variants[0] || null;
    this.activeProduct = product;
    this.selections = initialVariant ? [...initialVariant.options] : [];

    product.options.forEach((optionName, index) => {
      const values = this.getOptionValues(index);
      if (this.isColourOption(optionName) || values.length > 1) this.selections[index] = '';
    });

    this.activeVariant = this.findVariant(this.selections);
    this.lastTrigger = trigger;
    this.renderProduct();
    this.openDialog();
  }

  openDialog() {
    if (!this.dialog || this.dialog.open) return;

    if (typeof this.dialog.showModal === 'function') {
      this.dialog.showModal();
    } else {
      this.dialog.setAttribute('open', '');
      this.dialog.classList.add('is-fallback-open');
      document.body.classList.add('gift-guide-dialog-open');
    }

    requestAnimationFrame(() => this.dialog.querySelector('[data-gift-guide-close]')?.focus());
  }

  closeDialog() {
    if (!this.dialog) return;

    if (this.dialog.classList.contains('is-fallback-open')) {
      this.dialog.removeAttribute('open');
      this.dialog.classList.remove('is-fallback-open');
      document.body.classList.remove('gift-guide-dialog-open');
      this.restoreFocus();
      return;
    }

    if (this.dialog.open) this.dialog.close();
  }

  renderProduct() {
    if (!this.activeProduct || !this.dialog) return;

    const image = this.dialog.querySelector('[data-product-image]');
    image.src = this.activeProduct.image || '';
    image.alt = this.activeProduct.imageAlt || this.activeProduct.title;
    image.hidden = !this.activeProduct.image;

    this.dialog.querySelector('[data-product-title]').textContent = this.activeProduct.title;
    this.dialog.querySelector('[data-product-description]').textContent = this.activeProduct.description;
    this.dialog.querySelector('[data-product-options]').replaceChildren(this.createOptionControls());
    this.dialog.querySelector('[data-gift-guide-add-label]').textContent = 'Add to cart';
    this.dialog.querySelector('[data-gift-guide-status]').textContent = '';
    this.renderVariantState();
  }

  createOptionControls() {
    const fragment = document.createDocumentFragment();
    const optionPriority = (optionName) => {
      if (this.isColourOption(optionName)) return 0;
      if (optionName.toLowerCase() === 'size') return 1;
      return 2;
    };
    const options = this.activeProduct.options
      .map((optionName, index) => ({ optionName, index }))
      .sort((a, b) => optionPriority(a.optionName) - optionPriority(b.optionName) || a.index - b.index);

    options.forEach(({ optionName, index }) => {
      const values = this.getOptionValues(index);
      if (optionName === 'Title' && values.length === 1 && values[0] === 'Default Title') return;

      const fieldset = document.createElement('fieldset');
      fieldset.className = 'gift-guide-option';

      const legend = document.createElement('legend');
      legend.className = 'gift-guide-option__label';
      legend.textContent = optionName;
      fieldset.append(legend);

      if (this.isColourOption(optionName)) {
        fieldset.append(this.createColourChoices(values, index));
      } else {
        fieldset.append(this.createOptionSelect(optionName, values, index));
      }

      fragment.append(fieldset);
    });

    return fragment;
  }

  createColourChoices(values, index) {
    const choices = document.createElement('div');
    choices.className = 'gift-guide-option__choices';

    values.forEach((value) => {
      const label = document.createElement('label');
      label.className = 'gift-guide-option__choice-label';

      const input = document.createElement('input');
      input.className = 'gift-guide-option__radio';
      input.type = 'radio';
      input.name = `gift-guide-${this.dataset.sectionId}-${index}`;
      input.value = value;
      input.dataset.optionIndex = index;
      input.checked = this.selections[index] === value;

      const text = document.createElement('span');
      text.className = 'gift-guide-option__choice';
      text.textContent = value;
      const colour = this.getColourValue(value);
      text.style.setProperty('--gift-guide-choice-color', colour);
      label.append(input, text);
      choices.append(label);
    });

    return choices;
  }

  getColourValue(value) {
    const normalized = value.trim().toLowerCase();
    const aliases = {
      grey: '#808080',
      gray: '#808080',
      'light grey': '#d3d3d3',
      'light gray': '#d3d3d3',
      'dark grey': '#4a4a4a',
      'dark gray': '#4a4a4a',
      navy: '#000080',
      'navy blue': '#000080',
      beige: '#d8c3a5',
      cream: '#fffdd0',
      burgundy: '#800020',
      maroon: '#800000',
    };
    const directColour = aliases[normalized] || normalized;

    if (typeof CSS !== 'undefined' && CSS.supports('color', directColour)) return directColour;

    const namedColour = [
      'black',
      'white',
      'grey',
      'gray',
      'blue',
      'red',
      'green',
      'yellow',
      'orange',
      'purple',
      'pink',
      'brown',
      'beige',
      'navy',
    ].find((name) => normalized.includes(name));

    return aliases[namedColour] || namedColour || '#777';
  }

  createOptionSelect(optionName, values, index) {
    const wrap = document.createElement('div');
    wrap.className = 'gift-guide-option__select-wrap';

    const select = document.createElement('select');
    select.className = 'gift-guide-option__select';
    select.dataset.optionIndex = index;
    select.setAttribute('aria-label', optionName);

    if (values.length > 1) {
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = `Choose your ${optionName.toLowerCase()}`;
      placeholder.disabled = true;
      placeholder.selected = !this.selections[index];
      select.append(placeholder);
    }

    values.forEach((value) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      option.selected = this.selections[index] === value;
      select.append(option);
    });

    wrap.append(select);
    return wrap;
  }

  getOptionValues(index) {
    return [...new Set(this.activeProduct.variants.map((variant) => variant.options[index]))];
  }

  isColourOption(optionName) {
    return ['color', 'colour'].includes(optionName.toLowerCase());
  }

  findVariant(selections) {
    if (!selections.length || selections.some((value) => !value)) return null;
    return this.activeProduct.variants.find((variant) =>
      variant.options.every((value, index) => value === selections[index]),
    );
  }

  findPriceVariant() {
    return (
      this.activeVariant ||
      this.activeProduct.variants.find(
        (variant) =>
          variant.available &&
          variant.options.every((value, index) => !this.selections[index] || value === this.selections[index]),
      ) ||
      this.activeProduct.variants[0]
    );
  }

  renderVariantState() {
    if (!this.dialog || !this.activeProduct) return;

    const price = this.dialog.querySelector('[data-product-price]');
    const button = this.dialog.querySelector('[data-gift-guide-add]');
    const status = this.dialog.querySelector('[data-gift-guide-status]');
    const hasIncompleteSelection = this.selections.some((value) => !value);

    price.textContent = this.findPriceVariant()?.priceText || '';
    button.disabled = !this.activeVariant?.available;
    button.setAttribute('aria-disabled', String(button.disabled));

    if (hasIncompleteSelection) {
      status.textContent = '';
    } else if (this.activeVariant && !this.activeVariant.available) {
      status.textContent = window.variantStrings?.soldOut || 'Sold out';
    } else if (!this.activeVariant) {
      status.textContent = window.variantStrings?.unavailable || 'This combination is unavailable.';
    } else {
      status.textContent = '';
    }
  }

  async addToCart() {
    const variant = this.activeVariant;
    const button = this.dialog?.querySelector('[data-gift-guide-add]');
    const buttonLabel = this.dialog?.querySelector('[data-gift-guide-add-label]');
    const status = this.dialog?.querySelector('[data-gift-guide-status]');
    if (!variant?.available || !button || !buttonLabel || !status) return;

    const variantValues = variant.options.map((value) => value.trim().toLowerCase());
    const includeCompanion =
      variantValues.includes('black') && variantValues.includes('medium') && this.companionVariantId;
    const items = [{ id: Number(variant.id), quantity: 1 }];

    if (includeCompanion && Number(this.companionVariantId) !== Number(variant.id)) {
      items.push({ id: Number(this.companionVariantId), quantity: 1 });
    }

    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    buttonLabel.textContent = 'Adding…';
    status.textContent = '';

    try {
      const response = await fetch(window.routes?.cart_add_url || '/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ items }),
      });
      const data = await response.json();

      if (!response.ok || data.status) {
        throw new Error(data.description || data.message || 'Unable to add this product to your cart.');
      }

      if (typeof publish === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
        try {
          await publish(PUB_SUB_EVENTS.cartUpdate, {
            source: 'gift-guide',
            productVariantId: variant.id,
            cartData: data,
          });
        } catch (eventError) {
          console.error('Gift Guide cart UI refresh failed.', eventError);
        }
      }

      buttonLabel.textContent = 'Added to cart';
      status.textContent = includeCompanion
        ? 'Added to cart with the Soft Winter Jacket.'
        : 'Added to cart.';
    } catch (error) {
      console.error('Gift Guide add to cart failed.', error);
      buttonLabel.textContent = 'Add to cart';
      status.textContent = error.message || 'Unable to add this product to your cart.';
    } finally {
      button.removeAttribute('aria-busy');
      button.disabled = !this.activeVariant?.available;
      button.setAttribute('aria-disabled', String(button.disabled));
    }
  }

  restoreFocus() {
    if (this.lastTrigger?.isConnected) this.lastTrigger.focus();
  }
}

if (!customElements.get('gift-guide-grid')) {
  customElements.define('gift-guide-grid', GiftGuideGrid);
}
