# Server Monitoring System  

This project is a scalable microservices-based solution for monitoring the health and performance of servers and popular web applications. It provides real-time metrics collection and visualization using modern technologies.  

## Features  
- **Real-time website monitoring**
- **Response time tracking**
- **Outage detection and reporting**
- **Historical data visualization**
- **REST API endpoints**
- **Modern React dashboard**
- **MongoDB integration**

## Tech Stack  
- **Backend:** FastAPI  
- **Frontend:** Reactjs
- **DevOps:** Docker, Docker Compose  
- **Monitoring:** APScheduler  
- **Database:** MongoDB  

## Getting Started  

### Prerequisites  
- Docker.  

### Installation  
1. Clone the repository:

   ```bash  
   git clone https://github.com/IlyaKrasheninnikov/server-monitoring-sys.git  
   cd server-monitoring-sys
   ```
   
2. Set up backend, frontend and mongodb containers using docker:
  
    ```bash
    docker compose up
    ```

4. Access frontend:

   Open http://localhost:3000/ in your browser.


### API Endpoints

- ```GET /monitor/status/{url}``` - Get website status detailed information
- ```POST /monitor/report/{url}``` - Report website issue
- ```GET /monitor/outage-history/{url}``` - Get outage history
- ```GET /monitor/last-reported``` - Get recently reported websites
- ```GET /monitor/latest-checked```- Get recently checked websites
- ```GET /health``` - Service health check

## Demo

![Demo](https://github.com/user-attachments/assets/0d7c8f70-1218-4415-a506-76870fce3cd7)
![Demo](https://github.com/user-attachments/assets/d2c2d1d5-49aa-4bce-8185-350f4349518b)
![Demo](https://github.com/user-attachments/assets/297e45c2-3197-4b61-8df2-099125072da5)
