.PHONY: help build up down logs clean

help:
	@echo "Доступные команды:"
	@echo "  make build   - Собрать все образы"
	@echo "  make up      - Запустить все сервисы в фоне"
	@echo "  make down    - Остановить и удалить контейнеры"
	@echo "  make logs    - Показать логи"
	@echo "  make clean   - Остановить контейнеры и удалить тома (сброс БД)"

build:
	docker-compose build --no-cache

up:
	docker-compose up -d --build

down:
	docker-compose down

logs:
	docker-compose logs -f

clean:
	docker-compose down -v