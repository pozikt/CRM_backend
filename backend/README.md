# practice

Добавлен backend для calls и employees в папке crmback и страница для employees.

Для запуска backend:
1. Перейти в папку: `cd crmback`
2. (необязательно) Создать виртуальное окружение: `python -m venv venv` и активировать его `venv\scripts\activate`
3. Установить зависимости: `pip install -r requirements.txt`
4. Запустить сервер: `python -m uvicorn app.main:app --reload`

Для запуска frontend:
1. Перейти в папку: `cd crmfront`
2. Запустить сервер: `python -m http.server 5500`
   либо через расширение Live Server в VS Code.
