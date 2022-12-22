/*

Краткий алгоритм работы скрипта:

1. На старте запускаю функцию getItems() и получаю данные через Fetch API
2. Если все ок, идем по цепоки Promise, первым делом преобразую JSON формат в объект JavaScript
3. Далее обрезаем полученные данные из массива в размере 10 штук - метод splice() (так же см. пункт 8)
4. После фильтрую полученныt данные по одному из фильтров - метод sort() (так же см. пункт 8)
5. Далее создаю пукнты списка, основываясь на свойство title и id для каждого объекта массива
6. После создаю слушатель на каждый созданный пункт списка на ховер и анховер. При ховере запускает функция, которая на основе элемента (ховернутого)
и объекта получает нужные данные о товаре и выводит это в карочку товара. При анховере карточка с товаром удаляется. Думаю слушатель на ховер и анховер можно
в перпективе заменить одним слушателем для оптимизации, но мне не пришел в голову некий event слушателя, поэтому оставил как получилось
7. Далее делаю слушатель на кпноки стрелочек для передвижение элементов по спику вверх/ввниз
8. После добавляю прослушку на инпуты (изменение положения)
После выполнение пункта 7 или 8, значение инпутов обнуляет, а плейсхолдеры обновляются, это сделано для удобной навигации по списку
9. Так же добавил слушатели на выпадающие списки по количеству и фильтрации элементов, которые при изменение переходят к пункту 1 и все по новой.
10. Ну и при ошибки подключения по запросу, выдаю текст в html об ошибке

*/


document.addEventListener("DOMContentLoaded", (e) => { // Дожидаюсь прогрузки дом-дерева

    startAnimation();
    getItems(); // Вызываем функцию на старте скрипта для подгрузки данных

    // Слушаем изменение количества выгрузки
    document.querySelector('.select-list-counts').addEventListener('change', () => {
        getItems(document.querySelector('.select-list-counts').value, document.querySelector('.select-filter').value);
        startAnimation(); // Анимация прогрузки
        addStatusText('Загрузка...');
    })

    // Слушаем фильтрацию
    document.querySelector('.select-filter').addEventListener('change', () => {
        getItems(document.querySelector('.select-list-counts').value, document.querySelector('.select-filter').value);
        startAnimation(); // Анимация прогрузки
        addStatusText('Загрузка...');
    })

    // Функция, которая получает данные
    function getItems(count = 10, filterValue = 'id') {
        fetch('https://dummyjson.com/products') // Пытаемся получить данные
            .then(response => response.json()) // Преобразуем данные из Json формата в объект
            .then(data => {

                startAnimation(); // Анимация прогрузки

                const products = data.products.splice(0, count); // Урезаем полученный объект

                getFilterMethod(products, filterValue); // смотрим какой метод филтрации выбран 


                // После того как все данные получены и отсортированы, удаляем элементы если их нет
                checkElement(document.querySelector('.loader'))
                checkElement(document.querySelector('.note-text'))
                checkElement(document.querySelector('.products-list'))

                // Создаю базовый список
                createBasisList();

                // Создаем отображем пукнты списка, основываясь на названии товара и id
                products.forEach((product, index) => {
                    createListItems(product.id, product.title, index);
                });

                // Возвращаем из звена цепочки созданные в html пукнты списка, + выгружаем объект со всеми товарами (ограниченым фильтром само собой)
                return [document.querySelectorAll('.product-link'), products];

            }).then(data => {

                // Делаем прослушку на ховер
                data[0].forEach(item => {
                    item.addEventListener('mouseenter', (e) => {
                        showProductInfoCart(e.target.getAttribute('data-product-id'), data[1]);
                    })
                })

                // Делаем прослушку на анховер
                data[0].forEach(item => {
                    item.addEventListener('mouseleave', (e) => {
                        deleteProductInfoCart(e.target.getAttribute('data-product-id'));
                    })
                })

                showNote();

                // Перемещние вниз веерх по списку (кпноки)
                document.querySelectorAll('.product_nav-arrows').forEach(btnNav => {
                    btnNav.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.target.classList.forEach(item => {
                            let elem = e.target.closest('.products-item');
                            if (item == 'product_up-arrow') {
                                changeElementPositionByArrow(elem, 'before')
                            } else if (item == 'product_down-arrow') {
                                changeElementPositionByArrow(elem, 'after')
                            }
                            updatePlaceholdersAndValues();
                        });
                    })
                })

                // Перемещние по введеному значению (input)
                document.querySelectorAll('.item-pos-input').forEach((item, index) => {
                    item.addEventListener('keyup', (e) => {
                        if (e.keyCode === 13) {
                            let elem = e.target.closest('.products-item')
                            changeElementPositionByValue(elem, +e.target.value, document.querySelectorAll('.item-pos-input').length);
                            updatePlaceholdersAndValues();
                        }
                    })
                    item.addEventListener('click', (e) => {
                        e.preventDefault();
                    })
                })

            }).catch(() => { // Отрабатываем плохой исход запроса и оповещаем пользователя
                checkElement(document.querySelector('.loader'))
                checkElement(document.querySelector('.products-list'))
                addStatusText('Ошибка! :(')
            })
    }


    // Функция, которая фильтрует массив объектов по параметру filterValue
    function getFilterMethod(products, filterValue) {
        switch (filterValue) {
            case 'id':
                products.sort((a, b) => +a.id > +b.id ? 1 : -1)
                break;
            case 'title':
                products.sort((a, b) => a.title > b.title ? 1 : -1)
                break;
            case 'price-from-less':
                products.sort((a, b) => +a.price > +b.price ? 1 : -1)
                break;
            case 'price-from-more':
                products.sort((a, b) => +a.price < +b.price ? 1 : -1)
                break;
            default:
                break;
        }
    }

    // Функция, которая создает и вставляет базовый html список
    function createBasisList() {
        const basicHtml = `
            <ul class="products-list">
            </ul>
        `;
        document.querySelector('script').insertAdjacentHTML('beforebegin', basicHtml)
    }

    // Функция, которая создает и отображает пунты списка
    function createListItems(id, title, index) {
        // Создаю html шаблон для удобства в создании пунктов списка
        const htmlMenuItem = `
                <li class="products-item">
                    <a href="#" class="product-link" data-product-id = "${id}">${title}
                        <div class = "product_nav-arrows product_up-arrow"></div>
                        <div class = "product_nav-arrows product_down-arrow"></div>
                        <input type="number" class = "item-pos-input" name="name" required minlength="4" maxlength="8" size="10" placeholder = "${index + 1}">
                    </a>
                </li>
                `;

        // Вставляю в список ul
        document.querySelector('.products-list').insertAdjacentHTML('beforeend', htmlMenuItem)
    }

    // Функция, которая создает, заполняет и отображает карточку товара
    function showProductInfoCart(productId, data) {

        // Формирую 
        const htmlCardInfo = `
                <div class="product-info">
                    <p><strong class="product-info_id">ID: </strong>${getProductValue(data, productId).id}</p>
                    <p><strong class="product-info_name">Name: </strong>${getProductValue(data, productId).title}</p>
                    <p><strong class="product-info_brand">Brand: </strong>${getProductValue(data, productId).brand}</p>
                    <p><strong class="product-info_category">Category: </strong>${getProductValue(data, productId).category}</p>
                    <p><strong class="product-info_price">Price: </strong>${getProductValue(data, productId).price}</p>
                    <p><strong class="product-info_rating">Rating: </strong>${getProductValue(data, productId).rating}</p>
                    <p><strong class="product-info_description">Description: </strong>${getProductValue(data, productId).description}</p>
                    <p><strong class="product-img">Photo: </strong><img src="${getProductValue(data, productId).thumbnail}" alt="${getProductValue(data, productId).title} thumbnail"></p> 
                </div>
        `;

        // Проверяю существование, и далее вставляю в HTML
        if (!(document.querySelector(`[data-product-id="${productId}"]`).closest('.products-item').lastElementChild.className == 'product-info')) {
            document.querySelector(`[data-product-id="${productId}"]`).closest('.products-item').insertAdjacentHTML('beforeend', htmlCardInfo)
        }
    }

    // Фунция, котороая удаляет карточку из HTML, при анховере
    function deleteProductInfoCart(productId) {
        if (document.querySelector(`[data-product-id="${productId}"]`).closest('.products-item').lastElementChild.className == 'product-info') {
            document.querySelector(`[data-product-id="${productId}"]`).closest('.products-item').lastElementChild.remove()
        }
    }

    // Функиця, которая получает данные товара по data-attribute и далее возвращает (необходимо для создание карточки товара)
    function getProductValue(data, id) {
        let value;
        data.forEach(item => {
            if (item.id == id) {
                value = item;
            }
        })
        return value;
    }

    // Фукнция, котороая выводит текст в HTML дерево
    function addStatusText(status) {
        const htmlLoader = `<h1 class="loader">${status}</h1>`;
        document.querySelector('.select-filter').insertAdjacentHTML('afterend', htmlLoader)

    }

    // Функция, которая определет подымать или опускать элемент по списку (с проверкой на возможность это сделать)
    function changeElementPositionByArrow(item, direction) {
        if (direction == 'after') {
            if (item.parentNode.lastElementChild == item) {
                alert('Перемещение ниже невозможно!')
            } else {
                item.nextElementSibling.insertAdjacentElement('afterend', item)
            }
        } else if (direction == 'before') {
            if (item.parentNode.firstElementChild == item) {
                alert('Перемещение выше невозможно!')
            } else {
                item.previousElementSibling.insertAdjacentElement('beforebegin', item)
            }
        }
    }

    // Функция, которая определет на какое место поставить элемент
    function changeElementPositionByValue(elem, value, maxValue) {
        if (value && value >= 0 && value <= maxValue) {
            elem.parentNode.children[value - 1].after(elem);
        } else if (value < 0) {
            alert('Введите положительное число!')
        } else if (!(value <= maxValue)) {
            alert(`Слишком большое число, введите число от 1 до ${maxValue} включительно!`)
        } else if (!value) {
            alert('Поле пустое')
        }

    }

    // Функция, которая показывает пометку снизу страницы
    function showNote() {
        let htmlNote = `<p class="note-text"><strong>[DEV-INFO]</strong> В поле ввода (при ховере) введите число и нажмите Enter!</p>`
        document.querySelector('script').insertAdjacentHTML('beforebegin', htmlNote)
    }

    // Функция, которая обновляет значение и плэейсхолдер инпутов
    function updatePlaceholdersAndValues() {
        document.querySelectorAll('.item-pos-input').forEach((item, index) => {
            item.value = '';
            item.placeholder = index + 1;
        })
    }

    // Функция, котороая проверяет наличие элементов, есть есть - удаляет
    function checkElement(elem) {
        if (elem) {
            elem.remove()
        }
    }

    // Функция прогрузки, красота ради
    function startAnimation() {
        if (document.querySelector('.product-link')) {
            document.querySelectorAll('.product-link').forEach(item => {
                item.style.cssText = `
                    color: transparent;
                    background: linear-gradient(100deg, #a7b3c5 30%, #dae8fc 50%, #a7b3c5 70%);
                    background-size: 300%;
                    animation: loading 0.5s ease-in-out infinite;
                `
            })
        }
    }

});
