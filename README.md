## How to Run

### Using Docker Compose

1. Clone the repository or download the project files.
2. Create a `.env` file in the root directory, specifying the path to your point cloud data:

```
NODE_ENV=production
CLOUDS_PATH=/app/data/clouds
OUTPUT_PATH=/app/data/output
DATA_PATH=/path/to/your/local/data
Replace /path/to/your/local/data with the actual path to the data on your machine.
```

3. Build and run the project using Docker Compose:

```
docker-compose up --build
```

4. The application will be available at:

- React app (UI) on http://localhost:3000
- Express server on http://localhost:3001

5. Modify the port mappings in the docker-compose.yml file if necessary.
