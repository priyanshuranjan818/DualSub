# LearnWithMe (DualSub)

LearnWithMe is a web application designed to help users learn by providing dual subtitles for videos. The application utilizes `yt-dlp` to extract video information and subtitles, and optionally integrates with DeepL for high-quality translations.

## Prerequisites

Before you begin, ensure you have the following installed on your machine:
* [Docker](https://www.docker.com/products/docker-desktop) and Docker Compose
* Node.js and npm (if running locally without Docker)

## Getting Started (The Easy Way - Docker)

The easiest way to run the application is using Docker. This ensures all dependencies (like Python, `yt-dlp`, and Node.js) are packaged and ready to go.

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <your-repository-url>
   cd LearnWIthMe
   ```

2. **Start the application** using Docker Compose:
   ```bash
   docker-compose up -d
   ```
   *Note: The `-d` flag runs the container in the background.*

3. **Access the application**:
   Open your web browser and navigate to: [http://localhost:3001](http://localhost:3001)

4. **Stopping the application**:
   To stop the running container, execute:
   ```bash
   docker-compose down
   ```

## Configuration

You can configure the application through the `docker-compose.yml` file. 

* **Port**: By default, the app runs on port `3001`. You can change the port mapping in `docker-compose.yml`.
* **Translations**: If you want better translations, you can add your DeepL API key to the `docker-compose.yml` file under the `environment` section:
  ```yaml
  environment:
    - DEEPL_KEY=your-deepl-api-key-here
  ```

## Project Structure

The project is structured as a monorepo with the following main directories:

* `/frontend`: Contains the React/Vite frontend application.
* `/backend`: Contains the Node.js backend server that handles API requests, video downloading, and subtitle processing.
* `/shared`: Contains shared logic, constants, and utilities used by both the frontend and backend.

## Troubleshooting

* If you encounter issues with subtitles not downloading, ensure the video you are trying to access has subtitles available.
* You can view the application logs by running: `docker logs dualsub-app -f`

## License

[Add your license information here]
