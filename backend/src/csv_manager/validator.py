"""
Модуль валидации CSV-файлов для импорта проектов.
Изолирует логику валидации от основного маршрутизатора.
"""

import csv
from io import StringIO
from typing import Dict, List, Tuple, Optional
from datetime import datetime


class CSVValidationError(Exception):
    """Исключение для ошибок валидации CSV"""
    pass


class ProjectCSVValidator:
    """Валидатор для CSV-файлов проектов"""
    
    # Обязательные колонки
    REQUIRED_COLUMNS = {"name"}
    
    # Допустимые колонки
    ALLOWED_COLUMNS = {
        "name",
        "description",
        "status",
        "priority",
        "progress",
        "client_name",
        "client_contact",
        "manager_id",
        "start_date",
        "deadline_date",
        "tags"
    }
    
    # Ограничения на значения
    CONSTRAINTS = {
        "progress": {"min": 0.0, "max": 100.0},
        "name": {"min_length": 1, "max_length": 255},
        "description": {"max_length": 5000},
        "client_name": {"max_length": 255},
        "client_contact": {"max_length": 255},
        "tags": {"max_length": 1000}
    }
    
    def __init__(self, available_statuses: Dict[str, int], available_priorities: Dict[str, int]):
        """
        Инициализация валидатора
        
        Args:
            available_statuses: Словарь {название_статуса: id}
            available_priorities: Словарь {название_приоритета: id}
        """
        self.available_statuses = {k.lower(): v for k, v in available_statuses.items()}
        self.available_priorities = {k.lower(): v for k, v in available_priorities.items()}
        self.validation_errors: List[Dict] = []
        self.validation_warnings: List[Dict] = []
    
    def validate_file(self, content: str) -> Tuple[bool, Dict]:
        """
        Полная валидация CSV-файла
        
        Args:
            content: Содержимое CSV-файла в виде строки
            
        Returns:
            Кортеж (is_valid, result_dict)
        """
        self.validation_errors = []
        self.validation_warnings = []
        
        try:
            # Проверка кодировки и парсинга
            reader = csv.DictReader(StringIO(content))
            
            if reader.fieldnames is None:
                return False, {
                    "is_valid": False,
                    "error": "Файл пуст или не содержит заголовков",
                    "errors": ["Файл не содержит данных"],
                    "warnings": [],
                    "stats": {"total_rows": 0, "valid_rows": 0}
                }
            
            # Проверка заголовков
            self._validate_headers(reader.fieldnames)
            
            # Проверка строк
            rows = list(reader)
            for i, row in enumerate(rows, start=2):  # Начинаем со строки 2 (после заголовка)
                self._validate_row(row, i)
            
            # Формирование результата
            is_valid = len(self.validation_errors) == 0
            valid_rows = len(rows) - len([e for e in self.validation_errors if "Row" in str(e)])
            
            return is_valid, {
                "is_valid": is_valid,
                "stats": {
                    "total_rows": len(rows),
                    "valid_rows": valid_rows,
                    "error_rows": len([e for e in self.validation_errors if "Row" in str(e)])
                },
                "errors": self.validation_errors[:20],  # Первые 20 ошибок
                "warnings": self.validation_warnings[:20],  # Первые 20 предупреждений
                "error_count": len(self.validation_errors),
                "warning_count": len(self.validation_warnings)
            }
            
        except Exception as e:
            return False, {
                "is_valid": False,
                "error": f"Ошибка при обработке файла: {str(e)}",
                "errors": [str(e)],
                "warnings": [],
                "stats": {"total_rows": 0, "valid_rows": 0}
            }
    
    def _validate_headers(self, fieldnames: List[str]) -> None:
        """Валидация заголовков CSV"""
        if not fieldnames:
            self.validation_errors.append("Файл не содержит заголовков")
            return
        
        # Проверка обязательных колонок
        missing_required = self.REQUIRED_COLUMNS - set(f.lower() for f in fieldnames)
        if missing_required:
            self.validation_errors.append(
                f"Отсутствуют обязательные колонки: {', '.join(missing_required)}"
            )
        
        # Проверка неизвестных колонок
        unknown_columns = set(f.lower() for f in fieldnames) - self.ALLOWED_COLUMNS
        if unknown_columns:
            self.validation_warnings.append(
                f"Неизвестные колонки (будут пропущены): {', '.join(unknown_columns)}"
            )
    
    def _validate_row(self, row: Dict[str, str], row_number: int) -> None:
        """Валидация одной строки CSV"""
        errors = []
        
        # Проверка обязательного поля "name"
        name = row.get("name", "").strip()
        if not name:
            errors.append("Поле 'name' пусто")
        elif len(name) > self.CONSTRAINTS["name"]["max_length"]:
            errors.append(f"Поле 'name' превышает максимальную длину ({self.CONSTRAINTS['name']['max_length']})")
        
        # Проверка description
        description = row.get("description", "").strip()
        if description and len(description) > self.CONSTRAINTS["description"]["max_length"]:
            errors.append(f"Поле 'description' превышает максимальную длину")
        
        # Проверка progress
        progress_str = row.get("progress", "").strip()
        if progress_str:
            try:
                progress = float(progress_str)
                if not (self.CONSTRAINTS["progress"]["min"] <= progress <= self.CONSTRAINTS["progress"]["max"]):
                    errors.append(f"Поле 'progress' должно быть между 0 и 100, получено: {progress}")
            except ValueError:
                errors.append(f"Поле 'progress' содержит некорректное значение: '{progress_str}'")
        
        # Проверка status
        status = row.get("status", "").strip()
        if status and status.lower() not in self.available_statuses:
            available = ", ".join(self.available_statuses.keys())
            errors.append(f"Неизвестный статус '{status}'. Доступные: {available}")
        
        # Проверка priority
        priority = row.get("priority", "").strip()
        if priority and priority.lower() not in self.available_priorities:
            available = ", ".join(self.available_priorities.keys())
            errors.append(f"Неизвестный приоритет '{priority}'. Доступные: {available}")
        
        # Проверка manager_id
        manager_id = row.get("manager_id", "").strip()
        if manager_id:
            try:
                int(manager_id)
            except ValueError:
                errors.append(f"Поле 'manager_id' должно быть числом, получено: '{manager_id}'")
        
        # Проверка дат
        for date_field in ["start_date", "deadline_date"]:
            date_str = row.get(date_field, "").strip()
            if date_str:
                if not self._is_valid_date(date_str):
                    errors.append(f"Поле '{date_field}' содержит некорректную дату: '{date_str}'. Используйте формат YYYY-MM-DD")
        
        # Проверка client_name и client_contact
        client_name = row.get("client_name", "").strip()
        if client_name and len(client_name) > self.CONSTRAINTS["client_name"]["max_length"]:
            errors.append(f"Поле 'client_name' превышает максимальную длину")
        
        client_contact = row.get("client_contact", "").strip()
        if client_contact and len(client_contact) > self.CONSTRAINTS["client_contact"]["max_length"]:
            errors.append(f"Поле 'client_contact' превышает максимальную длину")
        
        # Проверка tags
        tags = row.get("tags", "").strip()
        if tags and len(tags) > self.CONSTRAINTS["tags"]["max_length"]:
            errors.append(f"Поле 'tags' превышает максимальную длину")
        
        # Добавление ошибок в общий список
        for error in errors:
            self.validation_errors.append(f"Row {row_number}: {error}")
    
    @staticmethod
    def _is_valid_date(date_str: str) -> bool:
        """Проверка валидности даты в формате YYYY-MM-DD"""
        try:
            datetime.strptime(date_str, "%Y-%m-%d")
            return True
        except ValueError:
            return False
    
    def get_validation_report(self) -> Dict:
        """Получить подробный отчет валидации"""
        return {
            "errors": self.validation_errors,
            "warnings": self.validation_warnings,
            "error_count": len(self.validation_errors),
            "warning_count": len(self.validation_warnings)
        }
