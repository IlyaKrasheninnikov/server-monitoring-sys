# Server Monitoring System  

This project is a scalable microservices-based solution for monitoring the health and performance of servers and popular web applications. It provides real-time metrics collection and visualization using modern technologies.  

## Project Goals  
1. Build an efficient monitoring system for tracking the state of servers and services.  
2. Enable scalability through microservices architecture.  
3. Develop dashboards for visualizing server and application metrics.  
4. Automate deployment and maintenance processes using Docker.  

## Features  
- **Real-time monitoring** with Prometheus and Grafana dashboards.  
- **Backend services** built with FastAPI for data collection and processing.  
- **Microservices architecture** to ensure scalability and modularity.  
- **Automation** of deployment and CI/CD pipelines using GitHub Actions and Docker.  
- **Cross-platform UI** developed using React for user-friendly metric visualization.  

## Tech Stack  
- **Backend:** FastAPI  
- **Frontend:** Reactjs
- **DevOps:** Docker, Docker Compose  
- **Monitoring:** Prometheus, Grafana  
- **Database:** MongoDB  
- **CI/CD:** GitHub Actions  

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

## Demo

![Demo](https://github.com/user-attachments/assets/0d7c8f70-1218-4415-a506-76870fce3cd7)
![Demo](https://github.com/user-attachments/assets/d2c2d1d5-49aa-4bce-8185-350f4349518b)
![Demo](https://github.com/user-attachments/assets/297e45c2-3197-4b61-8df2-099125072da5)
