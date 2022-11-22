import escapeHtml from './utils/escape-html.js';
import fetchJson from './utils/fetch-json.js';

const IMGUR_CLIENT_ID = '28aaa2e823b03b1';
const BACKEND_URL = 'https://course-js.javascript.ru';

export default class ProductForm {
  defaultFormData = {
    title: '',
    description: '',
    quantity: 1,
    subcategory: '',
    status: 1,
    images: [],
    price: 100,
    discount: 0,
  };

  onSubmit = event => {
    event.preventDefault();

    this.save();
  };

  constructor(productId) {
    this.productId = productId;
    this.isNewProduct = !productId;

    this.urlCategory = new URL('api/rest/categories', BACKEND_URL);
    this.urlCategory.searchParams.set('_sort', 'weight');
    this.urlCategory.searchParams.set('_refs', 'subcategory');

    this.urlProduct = new URL('api/rest/products', BACKEND_URL);

    this.urlProductGet = new URL('api/rest/products', BACKEND_URL);
    this.urlProductGet.searchParams.set('id', this.productId);
  }

  async render() {
    const element = document.createElement("div");
    element.innerHTML = this.getTemplate();
    this.element = element.firstElementChild;

    this.subElements = this.getSubElements();

    this.loadData();

    this.initEventListener();

    return this.element;
  }

  getTemplate() {
    return `
      <div class="product-form">
        <form data-element="productForm" class="form-grid">
          <div class="form-group form-group__half_left">
            <fieldset>
              <label class="form-label">Название товара</label>
              <input required="" type="text" name="title" id="title" class="form-control" placeholder="Название товара">
            </fieldset>
          </div>
          <div class="form-group form-group__wide">
            <label class="form-label">Описание</label>
            <textarea required="" class="form-control" name="description" id="description" data-element="productDescription" placeholder="Описание товара"></textarea>
          </div>
          <div class="form-group form-group__wide" data-element="sortable-list-container">
            <label class="form-label">Фото</label>
              <div data-element="imageListContainer">
              </div>
              <button type="button" name="uploadImage" class="button-primary-outline">
                <span>Загрузить (coming soon..)</span>
              </button>
          </div>
          <div class="form-group form-group__half_left">
            <label class="form-label">Категория</label>
            <select class="form-control" name="subcategory" id="subcategory">
            </select>
          </div>
          <div class="form-group form-group__half_left form-group__two-col">
            <fieldset>
              <label class="form-label">Цена ($)</label>
              <input required="" type="number" name="price" id="price" class="form-control" placeholder="100">
            </fieldset>
            <fieldset>
              <label class="form-label">Скидка ($)</label>
              <input required="" type="number" name="discount" id="discount" class="form-control" placeholder="0">
            </fieldset>
          </div>
          <div class="form-group form-group__part-half">
            <label class="form-label">Количество</label>
            <input required="" type="number" class="form-control" name="quantity" id="quantity" placeholder="1">
          </div>
          <div class="form-group form-group__part-half">
            <label class="form-label">Статус</label>
            <select class="form-control" name="status" id="status">
              <option value="1">Активен</option>
              <option value="0">Неактивен</option>
            </select>
          </div>
          <div class="form-buttons">
            <button type="submit" name="save" class="button-primary-outline">
              ${this.isNewProduct ? 'Добавить товар' : 'Сохранить товар'}
            </button>
          </div>
        </form>
      </div>
      `
  }

  getSubElements() {
    const result = {};
    const elements = this.element.querySelectorAll("[data-element]");

    for (const subElement of elements) {
      const name = subElement.dataset.element;
      result[name] = subElement;
    }

    return result;
  }

  async loadData() {
    const resultCategoryPromise = fetchJson(this.urlCategory);
    const resultProductPromise = this.isNewProduct
      ? Promise.resolve([this.defaultFormData])
      : fetchJson(this.urlProductGet);

    const [resultCategory, resultProduct] = await Promise.all([resultCategoryPromise, resultProductPromise]);

    this.resultProduct = resultProduct[0];
    this.categories = resultCategory

    this.updateData();
  }

  updateData() {
    if (this.categories) {
      for (const category of this.categories) {
        for (const subCategory of category.subcategories) {
          let newOption = new Option(`${category.title} > ${subCategory.title}`, subCategory.id);
          this.subElements.productForm.elements.subcategory.append(newOption);
        }
      }
    }

    if (this.resultProduct) {
      this.subElements.productForm.elements.title.value = this.resultProduct.title;
      this.subElements.productForm.elements.description.value = this.resultProduct.description;
      this.subElements.productForm.elements.price.value = this.resultProduct.price;
      this.subElements.productForm.elements.discount.value = this.resultProduct.discount;
      this.subElements.productForm.elements.quantity.value = this.resultProduct.quantity;
      this.subElements.productForm.elements.status.value = this.resultProduct.status;
      this.subElements.productForm.elements.subcategory.value = this.resultProduct.subcategory;
      this.subElements.imageListContainer.innerHTML = this.loadImages();
    }

  }

  loadImages() {
    return '<ul class="sortable-list">' +
      this.resultProduct.images
        .map(item => {
          return `
          <li class="products-edit__imagelist-item sortable-list__item" style="">
          <input type="hidden" name="url" value="${item.url}">
          <input type="hidden" name="source" value="${item.source}">
          <span>
            <img src="icon-grab.svg" data-grab-handle="" alt="grab">
            <img class="sortable-table__cell-img" alt="Image" src="${item.url}">
            <span>${item.source}</span>
          </span>
          <button type="button">
            <img src="icon-trash.svg" data-delete-handle="" alt="delete">
          </button>
          </li>
      `
        })
        .join("") +
      '</ul>';
  }

  initEventListener() {
    this.subElements.productForm.addEventListener('submit', this.onSubmit);
  }

  async save() {
    const product = this.getFormData();

    try {
      const result = await fetchJson(this.urlProduct, {
        method: this.isNewProduct ? 'PUT' : 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(product),
      });

      this.dispatchEvent(result.id);
    } catch (error) {
      console.error('something went wrong', error);
    }
  }

  getFormData() {
    const product = {};

    if (this.productId) product.id = this.productId;
    product.title = this.subElements.productForm.elements.title.value;
    product.description = this.subElements.productForm.elements.description.value;
    product.price = Number(this.subElements.productForm.elements.price.value);
    product.discount = Number(this.subElements.productForm.elements.discount.value);
    product.quantity = Number(this.subElements.productForm.elements.quantity.value);
    product.status = Number(this.subElements.productForm.elements.status.value);
    product.subcategory = this.subElements.productForm.elements.subcategory.value;
    product.images = this.resultProduct.images;

    return product;
  }

  dispatchEvent(id) {
    const event = this.isNewProduct
      ? new CustomEvent('product-saved')
      : new CustomEvent('product-updated', { detail: id });

    this.element.dispatchEvent(event);
  }

  remove() {
    if (this.element) {
      this.element.remove();
    }
  }

  destroy() {
    this.remove();
    this.element = null;
    this.subElements = {};
  }

}
