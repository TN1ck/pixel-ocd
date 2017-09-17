import * as React from 'react';
import * as ReactDom from 'react-dom';
import * as keymaster from 'keymaster';
import {random, range, sample, throttle} from 'lodash';

const COLORS = [
  '#1dd2af', '#19b698', '#40d47e', '#2cc36b',
  '#4aa3df', '#2e8ece', '#a66bbe', '#9b50ba',
  '#3d566e', '#354b60', '#f2ca27', '#f4a62a',
  '#e98b39', '#ec5e00', '#ea6153', '#d14233',
  '#bdc3c7', '#cbd0d3', '#a3b1b2',
];

interface Tile {
  x: number;
  y: number;
  width: number;
}

interface PixelOCDProps {
  colors: string[];
  delayPerRound: number;
  transitionDuration: number;
}

class PixelOCD extends React.Component<PixelOCDProps, {
  height: number;
  width: number;
  position: Tile;
  animationIsRunning: boolean;
  backgroundColor: string;
  foregroundColor: string;
  tiles: Tile[][];
  togglePixel: boolean;
}> {
  constructor(props: PixelOCDProps) {
    super(props);
    const backgroundColor = this.getRandomColor()
    this.state = {
      width: window.innerWidth,
      height: window.innerHeight,
      position: {
        x: 0,
        y: 0,
        width: 0,
      },
      animationIsRunning: true,
      backgroundColor: backgroundColor,
      foregroundColor: this.getRandomColor([backgroundColor]),
      tiles: [],
      togglePixel: false,
    };
    this.startAnimation = this.startAnimation.bind(this);
  }
  componentWillMount() {
    keymaster('shift+c', this.startAnimation);
    keymaster('shift+t', this.togglePixel.bind(this));
    window.addEventListener('resize', throttle(() => {
      this.init();
    }, 200));
    this.init();
  }
  togglePixel() {
    this.setState({
      togglePixel: !this.state.togglePixel,
    });
  }
  startAnimation() {
    if (this.state.animationIsRunning) {
      return;
    }
    this.setState({
      animationIsRunning: !this.state.animationIsRunning,
    });
    const maxDelay = this.state.tiles.length * this.props.delayPerRound;
    setTimeout(() => {
      this.nextRound();
    }, maxDelay + this.props.transitionDuration);
  }
  init() {
    this.setDimensions();
    this.nextRound();
  }
  setDimensions() {
    const height = window.innerHeight;
    const width = window.innerWidth;
    this.setState({
      height,
      width,
    });
  }
  nextRound() {
    const nextPoint = this.generateRandomPosition();
    const nextTiles = this.calculateTiles(nextPoint);
    const nextForegroundColor = this.state.backgroundColor;
    const nextBackgroundColor = this.getRandomColor([this.state.backgroundColor, this.state.foregroundColor]);
    this.setState({
      animationIsRunning: false,
      position: nextPoint,
      tiles: nextTiles,
      backgroundColor: nextBackgroundColor,
      foregroundColor: nextForegroundColor,
    });
  }
  generateRandomPosition( ) {
    const width = 4;
    return {
      x: random(width, this.state.width - width),
      y: random(width, this.state.height - width),
      width,
    };
  }
  getRandomColor(filters: string[] = []) {
    return sample(this.props.colors.filter(c => {
      return !filters.includes(c);
    })) as any as string;
  }
  calculateTiles(position: Tile) {
    // we create an array for every layer, the first array will be the first layer
    // only use one tile size for now
    const sizes = [32];

    const tiles: Tile[][] = [];

    const createTileLayer = (position: Tile, innerTileWidth: number, tileWidth: number) => {

      const howOftenDoIfit = innerTileWidth / tileWidth;

      const max = howOftenDoIfit * 2 + 1;
      // top
      const top = range(0, max + 1).map((x) => {
        return {
          x,
          y: 0,
        };
      })
      // left
      const left = range(1, max).map(y => {
        return {
          x: 0,
          y,
        };
      })
      // right
      const right = range(1, max).map(y => {
        return {
          x: max,
          y,
        };
      })
      // bottom
      const bottom = range(0, max + 1).map(x => {
        return {
          x,
          y: max,
        };
      })

      const tiles = [
        ...top,
        ...right,
        ...bottom.reverse(),
        ...left.reverse(),
      ];

      const newTiles = tiles.map(({x, y}) => {

        const topLeft = {
          x: position.x - (innerTileWidth / 1) - tileWidth,
          y: position.y - (innerTileWidth / 1) - tileWidth,
        };

        return {
          x: (tileWidth * x) + topLeft.x,
          y: (tileWidth * y) + topLeft.y,
          width: tileWidth,
        };
      });
      // filter all tiles that are not visible
      return newTiles.filter(tile => {
        return !(tile.x + tileWidth < 0 || tile.x > this.state.width || tile.y + tileWidth < 0 ||tile.y > this.state.height);
      });
    }

    let currentWidth = 0;
    let currentSizeIndex = 0;

    while(true) {
      const size = sizes[currentSizeIndex];
      const nextTileLayer = createTileLayer(position, currentWidth, size);
      tiles.push(nextTileLayer);
      currentWidth += size;
      currentSizeIndex = currentSizeIndex + 1 >= sizes.length ? currentSizeIndex : currentSizeIndex + 1;

      const left = position.x;
      const right = this.state.width - left;
      const top = position.y;
      const bottom = this.state.height - top;
      if (currentWidth > left &&
          currentWidth > right &&
          currentWidth > top &&
          currentWidth > bottom) {
        break;
      }
    }

    return tiles;

  }
  render() {
    const {
      tiles,
      foregroundColor,
      backgroundColor,
    } = this.state;
    return (
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        height: this.state.height,
        width: this.state.width,
        overflow: 'hidden',
        background: backgroundColor,
      }}>
        <div
          style={{
            position: 'absolute',
            left: this.state.position.x,
            top: this.state.position.y,
            transform: 'translate(-50%, -50%)',
            background: this.state.togglePixel ? 'white' : backgroundColor,
            transitionProperty: 'background',
            transitionDuration: this.props.transitionDuration + 'ms',
            height: this.state.position.width,
            width: this.state.position.width,
            zIndex: 3,
          }}
          onClick={this.startAnimation}
        />
        {tiles.map((tileRow, i) => {
          return (
            <div key={i}>
              {tileRow.map((tile, j) => {
                return (
                  <div
                    key={j}
                    style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      width: tile.width,
                      height: tile.width,
                      transform: `translate3D(${tile.x}px, ${tile.y}px, 0) scale(${this.state.animationIsRunning ? 0 : 1})`,
                      transitionDelay: this.state.animationIsRunning ? (i * this.props.delayPerRound) + 'ms' : '0ms',
                      transitionTimingFunction: 'ease-out',
                      transitionProperty: 'transform',
                      transitionDuration: this.state.animationIsRunning ? `${this.props.transitionDuration}ms` : '0ms',
                      background: foregroundColor,
                    }}
                  />
                )
              })}
            </div>
          );
        })}
      </div>
    )
  }
}

ReactDom.render(
  <div>
    <a href="https://github.com/TN1ck/pixel-ocd" style={{
      position: 'absolute',
      zIndex: 2,
      color: 'white',
      bottom: 20,
      right: 20,
      textDecoration: 'none',
      opacity: 0.5,
    }}>{'source'}</a>
    <PixelOCD colors={COLORS} delayPerRound={100} transitionDuration={2000}/>
  </div>,
  document.getElementById('root'),
);
