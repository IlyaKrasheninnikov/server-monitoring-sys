FROM python:3.12-slim

WORKDIR /app

RUN pip install poetry

COPY pyproject.toml ./

RUN poetry config virtualenvs.create false

RUN poetry install --no-dev --no-interaction --no-ansi

COPY src/ ./src/

CMD ["poetry", "run", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
