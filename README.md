## How to Run

### Local Development

1. Clone the repository or download the project files.

```
git clone https://github.com/valery-ka/point-cloud-annotation-tool.git
cd point-cloud-annotation-tool
```

2. Install dependencies and run the development server:

```
npm install
npm run dev
```

The app will run by default on http://localhost:3000

### Using Docker Compose

1. Clone the repository or download the project files.
2. Create a `.env` file in the root directory, specifying the path to your point cloud data:

```
NODE_ENV=production
CLOUDS_PATH=/app/data/clouds
OUTPUT_PATH=/app/data/output
SERVER_PORT=3001
DATA_PATH=/path/to/your/local/data
Replace /path/to/your/local/data with the actual path to the data on your machine.
```

3. Build and run the project using Docker Compose:

```
docker-compose up --build
```

4. The application will be available at http://localhost:3001.
