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
            objects-config.json
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
        odometry/
            <frame_name_0>.json
            <frame_name_1>.json
            <frame_name_2>.json
        pointclouds/
            <frame_name_0>.pcd
            <frame_name_1>.pcd
            <frame_name_2>.pcd
            ... (other point clouds)
```

## Configuration Files

### `job-config.json`

Specifies the current operational mode of the tool and the default camera images.

```
{
    "type": "annotation",                // Can be "annotation" or "moderation"
    "detection_task": true,              // Uses objects-config.json
    "instance_segmentation_task": false, // Uses objects-config.json (N/A a.t.m)
    "semantic_segmentation_task": true,  // Uses classes-config.json
    "default_camera": "camera_name"      // Name of an existing camera
}
```

> `type` — Defines whether the session is for annotation or moderation.
>
> `detection_task` — Enables annotation of objects in the point cloud using 3D cuboids. Requires objects-config.json.
>
> `instance_segmentation_task` — Enables labeling of points belonging to individual object instances. Requires objects-config.json. **(Not available at the moment)**.
>
> `semantic_segmentation_task` — Enables semantic labeling of points in the point cloud by class. Requires classes-config.json.
>
> `default_camera` — Name of the camera that will be initially selected when viewing frames.

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
>
> The hidden flag determines whether the class is visible in the UI:
>
> If `hidden: true`, the class is not shown to users, but it remains in the internal label index order inside the config. This allows the system to preserve label indexing consistency while optionally hiding certain classes from the annotator interface.

### `objects-config.json`

Defines the list of available object types that can be used for **3D cuboid annotation**.  
Each object type can specify default size, color, attributes, and grouping behavior for better user experience.

The configuration is structured as a single JSON object, where **each key is an object label** (`car`, `van`, `person`, etc.). These entries fall into two general categories:

---

### Abstract Groups

Some entries (like `"vehicle"`) serve as **abstract categories** that group multiple related object types. These have the property:

- `"abstract": true`

Abstract entries do **not** represent physical objects themselves and cannot be annotated directly.  
Instead, when selected, the annotator will be prompted to choose one of the concrete child types (e.g., `"car"` or `"van"`).

---

### Concrete Object Types

Concrete object types (such as `"car"`, `"van"`, or `"person"`) contain:

- `title` — Human-readable name shown in the UI
- `description` — Optional description
- `type` — Canonical object class, used for grouping (e.g., `"vehicle"`, `"person"`)
- `parent` — (Optional) The abstract group this object belongs to (used to define hierarchy)
- `dimensions` — Approximate size (in meters), used for new cuboids
- `color` — Default color for the object in application
- `attributes` — List of tags or flags used for ML pipelines, analytics, etc.

---

### Type vs Parent

- `type` is used to group object types into broader categories
- `parent` is used only when the object is a **child of an abstract entry**.  
  This distinction allows flexible grouping: objects can be grouped visually (`parent`) and semantically (`type`) differently.

---

### Example

```
{
  "vehicle": {
    "title": "Vehicles",
    "description": "Object group with `vehicle` type",
    "abstract": true
  },
  "car": {
    "title": "Passenger car",
    "description": "",
    "parent": "vehicle",
    "type": "vehicle",
    "dimensions": {
      "height": 1.7,
      "length": 4.5,
      "width": 2.0
    },
    "color": "#1bd6ff",
    "attributes": ["parked", "door_open", "etalon_size"]
  },
  "person": {
    "title": "Person",
    "description": "",
    "type": "person",
    "dimensions": {
      "height": 1.75,
      "length": 0.7,
      "width": 0.7
    },
    "color": "#ff7a52",
    "attributes": []
  }
}
```

### `moderation-config.json`

Defines the list of potential issues that moderators can assign during review.
An entry with value: **"OTHER"** must exist to allow moderators to specify custom issues.

```
[
    {
        "value": "POINT_ISSUE_TYPE",
        "title": "Brief description of the issue",
        "moderatorHint": "Hint shown to the moderator",
        "workerHint": "Hint shown to the worker",
        "applicableTo": "point"
    },
    {
        "value": "OBJECT_ISSUE_TYPE",
        "title": "Brief description of the issue",
        "moderatorHint": "Hint shown to the moderator",
        "workerHint": "Hint shown to the worker",
        "applicableTo": "object"
    },
    // ... other issue definitions
    {
        "value": "OTHER",
        "title": "Other",
        "moderatorHint": "Any issue not covered by the predefined types",
        "applicableTo": "all",
    }
]
```

> `value` — Unique identifier of the issue type.
>
> `title` — Short label describing the issue.
>
> `moderatorHint` — Description shown to moderators to help them understand when to apply the issue.
>
> `workerHint` — Description shown to annotators to help fixing the issue.
>
> `applicableTo` — Specifies what type of annotation the issue applies to:
>
> - `point` — Applicable only to point-level annotations.
> - `object` — Applicable only to object-level annotations (e.g., cuboids).
> - `all` — Applicable to both point-level and object-level annotations.

## Calibration Files

The tool supports multiple camera models, including **Brown–Conrady** (standard pinhole with distortion) and **Kannala–Brandt** (fisheye). Each camera must have its calibration defined in a `.json` file with the following structure:

### **Brown–Conrady** model

```
{
  "extrinsic": [r00, r01, r02, tx, r10, r11, r12, ty, r20, r21, r22, tz, 0, 0, 0, 1],
  "intrinsic": [fx, 0.0, cx, 0.0, fy, cy, 0.0, 0.0, 1.0],
  "distortion": [k1, k2, p1, p2, k3, k4, k5, k6]
}
```

### **Kannala–Brandt** model

When using the Kannala–Brandt model, only the first four coefficients are read.

```
{
  "extrinsic": [r00, r01, r02, tx, r10, r11, r12, ty, r20, r21, r22, tz, 0, 0, 0, 1],
  "intrinsic": [fx, 0.0, cx, 0.0, fy, cy, 0.0, 0.0, 1.0],
  "distortion": [k1, k2, k3, k4]
}
```

> The tool automatically determines the distortion model based on the **number of coefficients**.

## Odometry Files

Odometry files provide the estimated position and orientation of the recording platform (e.g., a moving vehicle) at a specific point in time.  
This allows annotators to correct the position of 3D boxes, especially for static objects like parked cars, even when the data-collection vehicle is in motion.

```
{
  "transform": [
    [r00, r01, r02, tx],
    [r10, r11, r12, ty],
    [r20, r21, r22, tz],
    [  0,   0,   0,  1]
  ],
  "linmo": {
    "v_x": vx,
    "a_x": ax
  },
  "timestamp": ts
}
```
