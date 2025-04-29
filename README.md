# Point Cloud Annotation Tool

## Overview

Point Cloud Annotation Tool is a web-based application designed for visualizing, annotating, and moderating 3D point clouds with associated multi-camera imagery.
It provides flexible configuration options for both annotation tasks and moderation processes.
The tool is built with a focus on scalability, modularity, and efficient workflows for labeling large datasets.

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
2. Create a `.env` file in the root directory, specifying the server port, WebSocket port, and the path to your point cloud data:

```
SERVER_PORT=3001
REACT_APP_WS_PORT=3001
DATA_PATH=/path/to/your/local/data
```

Replace `/path/to/your/local/data` with the actual path to the data on your machine.

3. Build and run the project using Docker Compose:

```
docker-compose up --build
```

4. The application will be available at http://localhost:3001.

## Environment Variables

| Variable            | Description                                      | Example              |
| :------------------ | :----------------------------------------------- | :------------------- |
| `SERVER_PORT`       | Port for the Express server                      | `3001`               |
| `REACT_APP_WS_PORT` | Port used by the client to connect via WebSocket | `3001`               |
| `DATA_PATH`         | Absolute path to the dataset directory           | `/path/to/your/data` |

## Data Structure

The application expects the following directory structure inside the specified `data/` folder:

```
data/
    folder_name_0/
        calibrations/
            camera_name_0.json
            camera_name_1.json
            camera_name_2.json
            ... (other camera names)
        config/
            classes-config.json
            job-config.json
            moderation-config.json
        images/
            camera_name_0/
                <frame_name_0>.jpg (.jpeg, .png, .webp)
                <frame_name_1>.jpg (.jpeg, .png, .webp)
                <frame_name_2>.jpg (.jpeg, .png, .webp)
                ...
            camera_name_1/
                <frame_name_0>.jpg (.jpeg, .png, .webp)
                ...
            camera_name_2/
                ...
            ... (other camera folders)
        pointclouds/
            <frame_name_0>.pcd
            <frame_name_1>.pcd
            <frame_name_2>.pcd
            ... (other point clouds)
```

## Configuration Files

### `classes-config.json`

Defines the available semantic classes for annotation.
Each class must specify a label, a color, and a visibility flag (hidden).

```
[
    {
        "label": "VOID",         // The "VOID" class is REQUIRED.
        "color": "#bbbbbb",
        "hidden": true
    },
    {
        "label": "Road",
        "color": "#f2a813",
        "hidden": false
    },
    {
        "label": "Noise",
        "color": "#123456",
        "hidden": false
    }
    // ... other class definitions
]
```

> Note: The "VOID" class must always be present as it serves as a fallback for undefined points.

### `job-config.json`

Specifies the current operational mode of the tool and the default camera.

```
{
    "type": "annotation",            // Can be "annotation" or "moderation"
    "default_camera": "camera_name"  // Name of an existing camera
}
```

> `type` — Defines whether the session is for annotation or moderation.
>
> `default_camera` — Name of the camera that will be initially selected when viewing frames.

### `moderation-config.json`

Defines the list of potential issues that moderators can assign during review.
An entry with value: "OTHER" must exist to allow moderators to specify custom issues.

```
[
    {
        "value": "FIRST_ISSUE_TYPE",
        "title": "Brief description of the issue",
        "moderatorHint": "Hint shown to the moderator",
        "workerHint": "Hint shown to the worker",
        "applicableTo": "point"
    },
    // ... other issue definitions
    {
        "value": "OTHER",
        "title": "Other",
        "moderatorHint": "Any issue not covered by the predefined types",
        "applicableTo": "point",
        "icon": ""
    }
]
```
