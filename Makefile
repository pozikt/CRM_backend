.PHONY: help build up down logs clean

help:
	@echo "Доступные команды:"
	@echo "  make build   - Собрать все образы"
	@echo "  make up      - Запустить все сервисы"
	@echo "  make down    - Остановить и удалить контейнеры"
	@echo "  make logs    - Показать логи"
	@echo "  make clean   - Полная очистка (контейнеры, образы, тома)"

build:
	docker-compose build --no-cache

up:
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f

clean:
	docker-compose down -v
	docker system prune -af