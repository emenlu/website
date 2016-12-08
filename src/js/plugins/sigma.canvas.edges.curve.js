;(function() {
  'use strict';

  sigma.utils.pkg('sigma.canvas.edges');

  /**
   * This edge renderer will display edges as curves.
   *
   * @param  {object}                   edge         The edge object.
   * @param  {object}                   source node  The edge source node.
   * @param  {object}                   target node  The edge target node.
   * @param  {CanvasRenderingContext2D} context      The canvas context.
   * @param  {configurable}             settings     The settings function.
   */
  sigma.canvas.edges.curve = function(edge, source, target, context, settings) {
    var color = edge.color,
        prefix = settings('prefix') || '',
        edgeColor = settings('edgeColor'),
        defaultNodeColor = settings('defaultNodeColor'),
        defaultEdgeColor = settings('defaultEdgeColor'),
        sSize = source[prefix + 'size'],
        sX = source[prefix + 'x'],
        sY = source[prefix + 'y'],
        tX = target[prefix + 'x'],
        tY = target[prefix + 'y'],
        controlX,
        controlY,
        controlX2,
        controlY2;

    if (source.id === target.id) {
      controlX = sX - sSize * 7;
      controlY = sY;
      controlX2 = sX;
      controlY2 = sY + sSize * 7;
    } else {
      /* EDIT: less curvation */
      controlX = (sX + tX) / 2 + (tY - sY) / 8;
      /* EDIT: direction aware point with less curvation */
      if (tY > sY)
        controlY = (sY + tY) / 2 + (sX - tX) / 8;
      else
        controlY = (sY + tY) / 2 - (sX - tX) / 8;
    }

    if (!color)
      switch (edgeColor) {
        case 'source':
          color = source.color || defaultNodeColor;
          break;
        case 'target':
          color = target.color || defaultNodeColor;
          break;
        default:
          color = defaultEdgeColor;
          break;
      }

    /* EDIT: Add edge.highlight stuff */
    context.strokeStyle = color;
    if (edge.highlight) {
      context.lineWidth = 3 * (edge[prefix + 'size'] || 1);
      context.shadowBlur    = 2;
      context.shadowColor   = "#0A0A0A";
    } else {
      context.lineWidth = edge[prefix + 'size'] || 1;
    }

    context.beginPath();
    context.moveTo(sX, sY);
    if (source.id === target.id) {
      context.bezierCurveTo(controlX2, controlY2, controlX, controlY, tX, tY);
    } else {
      context.quadraticCurveTo(controlX, controlY, tX, tY);
    }
    context.stroke();
    
    /* EDIT: Reset edge highlight */
    context.shadowBlur    = 0;
    context.shadowColor   = undefined;
  };
})();
