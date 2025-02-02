import * as React from 'react';
import classNames from 'classnames';
import { ConfigContext } from '../config-provider';
import RowContext from './RowContext';
import { tuple } from '../_util/type';
import ResponsiveObserve, {
  Breakpoint,
  ScreenMap,
  responsiveArray,
} from '../_util/responsiveObserve';
import { detectFlexGapSupported } from '../_util/styleChecker';

const RowAligns = tuple('top', 'middle', 'bottom', 'stretch');
const RowJustify = tuple('start', 'end', 'center', 'space-around', 'space-between');

export type Gutter = number | Partial<Record<Breakpoint, number>>;
export interface RowProps extends React.HTMLAttributes<HTMLDivElement> {
  gutter?: Gutter | [Gutter, Gutter];
  align?: typeof RowAligns[number];
  justify?: typeof RowJustify[number];
  prefixCls?: string;
  wrap?: boolean;
}

const Row = React.forwardRef<HTMLDivElement, RowProps>((props, ref) => {
  const {
    prefixCls: customizePrefixCls,
    justify,
    align,
    className,
    style,
    children,
    gutter = 0,
    wrap,
    ...others
  } = props;

  const { getPrefixCls, direction } = React.useContext(ConfigContext);

  const [screens, setScreens] = React.useState<ScreenMap>({
    xs: true,
    sm: true,
    md: true,
    lg: true,
    xl: true,
    xxl: true,
  });

  const gutterRef = React.useRef<Gutter | [Gutter, Gutter]>(gutter);

  React.useEffect(() => {
    const token = ResponsiveObserve.subscribe(screen => {
      const currentGutter = gutterRef.current || 0;
      if (
        (!Array.isArray(currentGutter) && typeof currentGutter === 'object') ||
        (Array.isArray(currentGutter) &&
          (typeof currentGutter[0] === 'object' || typeof currentGutter[1] === 'object'))
      ) {
        setScreens(screen);
      }
    });
    return () => ResponsiveObserve.unsubscribe(token);
  }, []);

  const getGutter = (): [number, number] => {
    const results: [number, number] = [0, 0];
    const normalizedGutter = Array.isArray(gutter) ? gutter : [gutter, 0];
    normalizedGutter.forEach((g, index) => {
      if (typeof g === 'object') {
        for (let i = 0; i < responsiveArray.length; i++) {
          const breakpoint: Breakpoint = responsiveArray[i];
          if (screens[breakpoint] && g[breakpoint] !== undefined) {
            results[index] = g[breakpoint] as number;
            break;
          }
        }
      } else {
        results[index] = g || 0;
      }
    });
    return results;
  };

  const prefixCls = getPrefixCls('row', customizePrefixCls);
  const gutters = getGutter();
  const classes = classNames(
    prefixCls,
    {
      [`${prefixCls}-no-wrap`]: wrap === false,
      [`${prefixCls}-${justify}`]: justify,
      [`${prefixCls}-${align}`]: align,
      [`${prefixCls}-rtl`]: direction === 'rtl',
    },
    className,
  );

  // Add gutter related style
  let rowStyle: React.CSSProperties & {
    '--column-gap'?: string | number;
    '--row-gap'?: string | number;
  } = {};

  if (detectFlexGapSupported()) {
    rowStyle = {
      '--column-gap': '0px',
      '--row-gap': '0px',
    };

    if (gutters[0]! > 0) {
      const gap = gutters[0];
      rowStyle.columnGap = gap;
      rowStyle['--column-gap'] = `${gap}px`;
    }
    if (gutters[1]! > 0) {
      const gap = gutters[1];
      rowStyle.rowGap = gap;
      rowStyle['--row-gap'] = `${gap}px`;
    }
  } else {
    const horizontalGutter = gutters[0]! > 0 ? gutters[0] / -2 : undefined;
    const verticalGutter = gutters[1]! > 0 ? gutters[1] / -2 : undefined;

    rowStyle = {
      marginLeft: horizontalGutter,
      marginRight: horizontalGutter,
      marginTop: verticalGutter,
      marginBottom: verticalGutter,
    };
  }

  return (
    <RowContext.Provider value={{ gutter: gutters, wrap }}>
      <div {...others} className={classes} style={{ ...rowStyle, ...style }} ref={ref}>
        {children}
      </div>
    </RowContext.Provider>
  );
});

Row.displayName = 'Row';

export default Row;
