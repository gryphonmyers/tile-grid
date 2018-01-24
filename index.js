var defaults = require("defaults-es6/deep");

var defaultOpts = {
    maxRowWidth: 12,
    transforms: {
        itemDimensions: function(item){
            return [item.width, item.height];
        },
        grid: function(val){return val;},
        subGrid: function(val){return val;},
        gridNode: function(val){return val;}
    }
};

class GridRow {
    constructor(opts) {
        this.height = opts.height;
        this.width = opts.width;
        this.relativeWidth = opts.relativeWidth;
        this.cols = opts.cols;
        this.totalNodes = opts.totalNodes;
        this.isInverted = opts.isInverted;
    }
}

class GridNode {
    constructor(opts) {
        this.index = opts.index;
        this.width = opts.width;
        this.height = opts.height;
        this.relativeWidth = opts.relativeWidth;
        this.isInverted = opts.isInverted;
    }
}

class TileGrid {
    constructor(opts) {
        opts.transforms = defaults(opts.transforms, defaultOpts.transforms);
        opts = defaults(opts, defaultOpts);
        this.transforms = opts.transforms;
        this.maxRowWidth = opts.maxRowWidth;
        this.templates = {};
    }

    processData(data) {
        var rowSequence = [];
        var i = 0;
        while (i < data.length) {
            var row = this.buildRow(data.slice(i), this.maxRowWidth, i);
            rowSequence.push(row);
            i += row.totalNodes;
        }
        return this.transforms.grid(rowSequence, this);
    }

    buildRow(data, maxRowWidth, indexOffset, isInverted) {
        isInverted = !!isInverted;
        var cols = [];
        var i = 0;
        var rowHeight = 0;
        var rowWidth = 0;
        while(i < data.length) {
            var currentDim = this.transforms.itemDimensions(data[i], data[i - 1], rowWidth);
            var globalIndex = indexOffset ? i + indexOffset : i;
            var currentNode = new GridNode({
                width: currentDim[isInverted ? 1 : 0],
                height: currentDim[isInverted ? 0 : 1],
                index: globalIndex,
                isInverted: isInverted
            });
            var nextDim = data[i + 1] ? this.transforms.itemDimensions(data[i + 1], data[i], rowWidth) : null;
            if (nextDim) {
                var nextNode = new GridNode({
                    width: nextDim[isInverted ? 1 : 0],
                    height: nextDim[isInverted ? 0 : 1],
                    index: globalIndex + 1,
                    isInverted: isInverted
                });
            }
            var currentWidth = currentNode.width;
            var currentHeight = currentNode.height;
            var currentInc = 1;
            if (nextNode && currentNode.height + nextNode.height <= rowHeight) {
                currentNode = this.buildRow(data.slice(i), rowHeight, i, !isInverted);
                currentWidth = currentNode.height;
                currentHeight = currentNode.width;
                currentInc = currentNode.totalNodes;
            }
            var currentRowWidth = currentWidth + rowWidth;
            if (currentRowWidth > maxRowWidth) {
                break;
            }
            if (currentHeight > rowHeight) {
                rowHeight = currentHeight;
                rowWidth = 0;
                cols = [];
                i = 0;
            } else {
                currentNode.relativeWidth = currentWidth / maxRowWidth * this.maxRowWidth;
                cols.push(currentNode.constructor == GridRow ? this.transforms.subGrid(currentNode) : this.transforms.gridNode(currentNode, data[i]));
                rowWidth = currentRowWidth;
                i += currentInc;
            }
        }
        return new GridRow({
            cols: cols,
            height: rowHeight,
            width: rowWidth,
            totalNodes: i,
            isInverted: isInverted
        });
    }
}


module.exports = TileGrid;
