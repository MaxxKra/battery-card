# BATTERY - CARD

The Battery Card is a custom Home Assistant card designed to display battery levels with various layouts and styles. It offers flexible configuration options, including different layouts, styles, and image customization based on battery levels.


<img src="https://raw.githubusercontent.com/MaxxKra/README_images/master/Battery-Card/layout_right.jpg" alt="Example" width="300"/>

## Features

- Display battery levels with customizable images
- Multiple layout options to fit your dashboard design
- Style configuration for card, name, state, and image
- Simple integration with Home Assistant

## Installation

1. Download the `battery-card.js` file.
2. Place the file in your `www` folder.
3. Add the following to your `ui-lovelace.yaml`:

```yaml
resources:
  - url: /local/battery-card.js
    type: module
```

## Configuration

### Basic Configuration

```yaml
type: 'custom:battery-card'
entity: sensor.battery_sensor
name: 'Battery Sensor'
layout: default
```

### Configuration Options

| Option       | Type   | Required | Default   | Description                                      |
|--------------|--------|----------|-----------|--------------------------------------------------|
| `entity`     | string | Yes      |           | The entity ID of the battery sensor              |
| `name`       | string | No       |           | Custom name to display                           |
| `layout`     | string | No       | default   | Layout of the card (options: default, bottom, left, right, top, line_left, line_right) |
| `styles`     | object | No       |           | Custom styles for different elements             |
| `rowGap`     | string | No       | '0'       | Gap between rows                                 |
| `columnGap`  | string | No       | '0'       | Gap between columns                              |

### Styles Configuration

The `styles` object can have the following properties:

| Style    | Type   | Description                                               |
|----------|--------|-----------------------------------------------------------|
| `name`   | array  | Custom CSS styles for the name                             |
| `state`  | array  | Custom CSS styles for the state                            |
| `card`   | array  | Custom CSS styles for the card                             |
| `image`  | array  | Custom CSS styles for the image                            |

#### Example

```yaml
type: 'custom:battery-card'
entity: sensor.battery_sensor
name: 'Battery Sensor'
layout: right
rowGap: '10px'
columnGap: '10px'
styles:
  name:
    - color: red
    - font-size: 20px
  state:
    - font-weight: bold
  card:
    - background-color: '#f0f0f0'
  image:
    - width: '50%'
```

### Layouts

The card supports multiple layout configurations:

| Layout     | Description                                                    |
|------------|----------------------------------------------------------------|
| `default`  | Default layout with the name at the top, image in the middle, and status at the bottom |
| `bottom`   | Image at the top, name in the middle, status at the bottom     |
| `left`     | Image in the middle left, name at the top, status on the left  |
| `right`    | Image in the middle right, name at the top, status on the right|
| `top`      | Name at the top, status in the middle, image at the bottom     |
| `line_left`| Image on the right, name and status on the left                |
| `line_right`| Image on the left, name and status on the right               |

### Advanced Configuration

For advanced users, the card can be further customized using CSS styles for individual elements.

#### Example

```yaml
type: 'custom:battery-card'
entity: sensor.battery_sensor
name: 'Battery Sensor'
layout: bottom
rowGap: '5px'
columnGap: '5px'
styles:
  name:
    - color: blue
    - text-align: center
  state:
    - color: green
    - font-size: 24px
  card:
    - background: '#ffffff'
    - border-radius: '10px'
  image:
    - width: '80%'
    - margin: '0 auto'
```

## License

This project is licensed under the MIT License.

## Contributing

Feel free to open issues or submit pull requests to improve the card. Your contributions are welcome!
