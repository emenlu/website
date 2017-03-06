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
    var prefix = settings('prefix') || '',
        defaultNodeColor = settings('defaultNodeColor'),
        sX = source[prefix + 'x'],
        sY = source[prefix + 'y'],
        tX = target[prefix + 'x'],
        tY = target[prefix + 'y'],
        controlX,
        controlY;

    /* EDIT: less curvation */
    controlX = (sX + tX) / 2 + (tY - sY) / 8;
    /* EDIT: direction aware point with less curvation */
    if (tY > sY)
      controlY = (sY + tY) / 2 + (sX - tX) / 8;
    else
      controlY = (sY + tY) / 2 - (sX - tX) / 8;
    
    
    /* EDIT: Add edge.highlight stuff */
    context.strokeStyle = target.color || defaultNodeColor;
    if (edge.highlight) {
      context.lineWidth = 3 * (edge[prefix + 'size'] || 1);
    } else {
      context.lineWidth = edge[prefix + 'size'] || 1;
    }

    context.beginPath();
    context.moveTo(sX, sY);
    context.quadraticCurveTo(controlX, controlY, tX, tY);
    context.stroke();
  };
})();
