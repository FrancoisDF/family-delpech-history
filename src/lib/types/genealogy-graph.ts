/**
 * Type definitions for genealogy graph structure
 */

/**
 * Position of a node in the graph layout
 */
export interface Position {
	x: number;
	y: number;
}

/**
 * Bounding box for the entire graph
 */
export interface CanvasBounds {
	minX: number;
	maxX: number;
	minY: number;
	maxY: number;
	width: number;
	height: number;
}

/**
 * Node in the genealogy graph
 * Can be either a person or a couple
 */
export interface GraphNode {
	id: string;
	type: 'person' | 'couple';
	label: string;
	position: Position;
	spouses?: string[]; // For couple nodes, contains the two spouse IDs
}

/**
 * Edge representing a relationship between two nodes
 */
export interface GraphEdge {
	source: string; // Node ID
	target: string; // Node ID
	type: 'spouse-to-couple' | 'couple-to-child' | 'couple-to-couple' | 'parent-to-child' | 'unknown';
}

/**
 * Metadata about the graph
 */
export interface GraphMetadata {
	generatedAt: string;
	totalNodes: number;
	totalPeople: number;
	totalCouples: number;
	totalEdges: number;
	generationLevels: number;
	rootNodes: string[];
	canvasBounds: CanvasBounds;
}

/**
 * Complete genealogy graph structure
 */
export interface GenealogyGraph {
	metadata: GraphMetadata;
	nodes: GraphNode[];
	edges: GraphEdge[];
}

/**
 * Node with additional rendering properties
 */
export interface RenderNode extends GraphNode {
	isSelected?: boolean;
	isHighlighted?: boolean;
	connectedNodes?: string[];
}

/**
 * Interaction state for the tree component
 */
export interface TreeInteractionState {
	selectedNodeId: string | null;
	zoomLevel: number;
	panX: number;
	panY: number;
	hoveredNodeId: string | null;
}

/**
 * Constants for rendering
 */
export const NODE_RADIUS = 30;
export const COUPLE_NODE_WIDTH = 100;
export const COUPLE_NODE_HEIGHT = 40;
export const EDGE_STROKE_WIDTH = 2;
export const EDGE_COLOR = '#8b7f73';
export const EDGE_HOVER_COLOR = '#c9a882';
export const NODE_COLOR = '#faf8f6';
export const NODE_HOVER_COLOR = '#f5f1ed';
export const SELECTED_NODE_COLOR = '#c9a882';
export const PERSON_NODE_COLOR = '#ffffff';
export const COUPLE_NODE_COLOR = '#faf8f6';

/**
 * Zoom limits
 */
export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 3;
export const ZOOM_SPEED = 0.1;
