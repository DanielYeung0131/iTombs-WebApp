"use client";

import { useState, useEffect, useRef } from "react";
import { User, X, ArrowLeft, Plus, Trash2 } from "lucide-react";

interface TreeNode {
  tree_id: number;
  user_id: number;
  relative_name: string;
  relationship: string;
  profile_url?: string;
}

interface NewRelative {
  relativeName: string;
  relationship: string;
  profileUrl: string;
}

interface GraphNode {
  id: string;
  name: string;
  x: number;
  y: number;
  data: TreeNode | null; // null for root node when no data exists
  isRoot?: boolean;
}

interface GraphEdge {
  from: string;
  to: string;
  relationship: string;
}

export default function FamilyTreeVisualization() {
  const [userId, setUserId] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      setUserId(searchParams.get("userid") || "");
    }
  }, []);

  const [userName] = useState("You"); // You can modify this to get actual user name

  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [newRelative, setNewRelative] = useState<NewRelative>({
    relativeName: "",
    relationship: "",
    profileUrl: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const [svgDimensions, setSvgDimensions] = useState({
    width: 800,
    height: 400,
  });

  const [isMobile, setIsMobile] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle responsive dimensions and mobile detection
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const windowWidth =
          typeof window !== "undefined" ? window.innerWidth : 1024;
        const isMobileView = windowWidth < 768;

        setIsMobile(isMobileView);

        // Adjust width based on container, ensuring it doesn't exceed a max for larger screens
        // and is more constrained for mobile.
        const width = Math.min(
          containerWidth,
          isMobileView ? windowWidth - 40 : 1000
        ); // Max width for desktop
        const height = isMobileView ? 500 : 600; // Fixed height, adjust as needed

        setSvgDimensions({ width, height });
      }
    };

    updateDimensions();
    if (typeof window !== "undefined") {
      window.addEventListener("resize", updateDimensions);
      return () => window.removeEventListener("resize", updateDimensions);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchTreeData();
    }
  }, [userId]);

  const fetchTreeData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tree?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setTreeData(data);
      } else {
        console.error("Failed to fetch tree data");
        // Fallback to empty array if API fails
        setTreeData([]);
      }
    } catch (error) {
      console.error("Error fetching tree data:", error);
      // Fallback to empty array if API fails
      setTreeData([]);
    } finally {
      setLoading(false);
    }
  };

  // Generate graph layout - always includes root node
  const generateLayout = (
    data: TreeNode[]
  ): { nodes: GraphNode[]; edges: GraphEdge[] } => {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    // Calculate center based on current SVG dimensions
    const centerX = svgDimensions.width / 2;
    const centerY = svgDimensions.height / 2;

    // Always create root node
    const rootNode = data.find((n) => n.relationship === "self");
    const rootNodeData: GraphNode = {
      id: "root-node",
      name: rootNode ? rootNode.relative_name : userName,
      x: centerX,
      y: centerY,
      data: rootNode || null,
      isRoot: true,
    };
    nodes.push(rootNodeData);

    // If no data, return just the root node
    if (data.length === 0) {
      return { nodes, edges };
    }

    // Define layers and distances for relationships
    const relationshipLayers = {
      spouse: { angle: 0, distance: isMobile ? 140 : 200 }, // Right
      parent: { angle: -90, distance: isMobile ? 140 : 200 }, // Top
      child: { angle: 90, distance: isMobile ? 140 : 200 }, // Bottom
      sibling: { angle: 180, distance: isMobile ? 140 : 150 }, // Left
      grandparent: { angle: -135, distance: isMobile ? 160 : 250 }, // Top-Left
      grandchild: { angle: 135, distance: isMobile ? 160 : 250 }, // Bottom-Left
      aunt: { angle: -45, distance: isMobile ? 150 : 220 }, // Top-Right (closer to parent arc)
      uncle: { angle: -45, distance: isMobile ? 150 : 220 }, // Top-Right (closer to parent arc)
      cousin: { angle: 45, distance: isMobile ? 150 : 220 }, // Bottom-Right (closer to child arc)
      nephew: { angle: 45, distance: isMobile ? 150 : 220 }, // Bottom-Right (closer to child arc)
      niece: { angle: 45, distance: isMobile ? 150 : 220 }, // Bottom-Right (closer to child arc)
    };

    // Keep track of counts for each relationship type to help with spacing
    const relationshipCounts: Record<string, number> = {};

    data.forEach((relative) => {
      if (relative.relationship === "self") return; // Skip self

      const relationship = relative.relationship.toLowerCase();
      relationshipCounts[relationship] =
        (relationshipCounts[relationship] || 0) + 1;
      const index = relationshipCounts[relationship] - 1; // 0-indexed count

      const config =
        relationshipLayers[relationship as keyof typeof relationshipLayers];

      if (!config) {
        console.warn(`No layout config for relationship: ${relationship}`);
        return;
      }

      let angleOffset = 0;
      let arcSpread = isMobile ? 30 : 40; // Degrees to spread nodes within an arc

      if (relationship === "parent" || relationship === "child") {
        if (relationshipCounts[relationship] === 1) {
          angleOffset = 0; // Center the first one
        } else if (relationshipCounts[relationship] === 2) {
          angleOffset = index === 0 ? -arcSpread / 2 : arcSpread / 2; // Spread two
        } else {
          // For more than two (e.g., step-parents, etc.), spread evenly
          angleOffset =
            (index - (relationshipCounts[relationship] - 1) / 2) *
            (arcSpread / (relationshipCounts[relationship] - 1));
        }
      } else if (relationship === "sibling") {
        arcSpread = isMobile ? 60 : 80;
        angleOffset =
          (index - (relationshipCounts[relationship] - 1) / 2) *
          (arcSpread / Math.max(1, relationshipCounts[relationship] - 1));
      } else if (
        [
          "aunt",
          "uncle",
          "cousin",
          "nephew",
          "niece",
          "grandparent",
          "grandchild",
        ].includes(relationship)
      ) {
        arcSpread = isMobile ? 40 : 60;
        angleOffset =
          (index - (relationshipCounts[relationship] - 1) / 2) *
          (arcSpread / Math.max(1, relationshipCounts[relationship] - 1));
      }

      const finalAngle = (config.angle + angleOffset) * (Math.PI / 180); // Convert to radians

      const x = centerX + Math.cos(finalAngle) * config.distance;
      const y = centerY + Math.sin(finalAngle) * config.distance;

      // Ensure nodes stay within bounds - considering node radius
      const nodeRadius = isMobile ? 25 : 30; // Use the smaller node radius for clamping
      const clampedX = Math.max(
        nodeRadius,
        Math.min(svgDimensions.width - nodeRadius, x)
      );
      const clampedY = Math.max(
        nodeRadius,
        Math.min(svgDimensions.height - nodeRadius, y)
      );

      const nodeId = `node-${relative.tree_id}`;
      nodes.push({
        id: nodeId,
        name: relative.relative_name,
        x: clampedX,
        y: clampedY,
        data: relative,
      });

      // Create edge from root to this node
      edges.push({
        from: "root-node",
        to: nodeId,
        relationship: relative.relationship,
      });
    });

    return { nodes, edges };
  };

  const { nodes, edges } = generateLayout(treeData);

  const handleNodeClick = (node: GraphNode) => {
    // Don't allow clicking on root node if it has no data
    if (node.isRoot && !node.data) return;
    setSelectedNode(node);
  };

  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    if (e.button === 0) {
      // Left click
      const rect = svgRef.current?.getBoundingClientRect();
      if (rect) {
        const node = nodes.find((n) => n.id === nodeId);
        if (node) {
          setDraggedNode(nodeId);
          setDragOffset({
            x: e.clientX - rect.left - node.x,
            y: e.clientY - rect.top - node.y,
          });
        }
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent, nodeId: string) => {
    const touch = e.touches[0];
    const rect = svgRef.current?.getBoundingClientRect();
    if (rect && touch) {
      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        setDraggedNode(nodeId);
        setDragOffset({
          x: touch.clientX - rect.left - node.x,
          y: touch.clientY - rect.top - node.y,
        });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedNode) {
      const rect = svgRef.current?.getBoundingClientRect();
      if (rect) {
        const nodeIndex = nodes.findIndex((n) => n.id === draggedNode);
        if (nodeIndex !== -1) {
          const newX = e.clientX - rect.left - dragOffset.x;
          const newY = e.clientY - rect.top - dragOffset.y;

          const nodeRadius = nodes[nodeIndex].isRoot
            ? isMobile
              ? 30
              : 35
            : isMobile
            ? 25
            : 30;
          nodes[nodeIndex].x = Math.max(
            nodeRadius,
            Math.min(svgDimensions.width - nodeRadius, newX)
          );
          nodes[nodeIndex].y = Math.max(
            nodeRadius,
            Math.min(svgDimensions.height - nodeRadius, newY)
          );
        }
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (draggedNode) {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = svgRef.current?.getBoundingClientRect();
      if (rect && touch) {
        const nodeIndex = nodes.findIndex((n) => n.id === draggedNode);
        if (nodeIndex !== -1) {
          const newX = touch.clientX - rect.left - dragOffset.x;
          const newY = touch.clientY - rect.top - dragOffset.y;

          const nodeRadius = nodes[nodeIndex].isRoot
            ? isMobile
              ? 30
              : 35
            : isMobile
            ? 25
            : 30;
          nodes[nodeIndex].x = Math.max(
            nodeRadius,
            Math.min(svgDimensions.width - nodeRadius, newX)
          );
          nodes[nodeIndex].y = Math.max(
            nodeRadius,
            Math.min(svgDimensions.height - nodeRadius, newY)
          );
        }
      }
    }
  };

  const handleMouseUp = () => {
    setDraggedNode(null);
  };

  const handleTouchEnd = () => {
    setDraggedNode(null);
  };

  const addRelative = async () => {
    if (!newRelative.relativeName || !newRelative.relationship) return;

    try {
      setSubmitting(true);
      const response = await fetch("/api/tree", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: parseInt(userId),
          relativeName: newRelative.relativeName,
          relationship: newRelative.relationship,
          profileUrl: newRelative.profileUrl || null,
        }),
      });

      if (response.ok) {
        setNewRelative({ relativeName: "", relationship: "", profileUrl: "" });
        setShowAddForm(false);
        fetchTreeData(); // Refresh the tree data
      } else {
        console.error("Failed to add relative");
      }
    } catch (error) {
      console.error("Error adding relative:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteRelative = async (treeId: number) => {
    if (!confirm("Are you sure you want to delete this relative?")) return;

    try {
      const response = await fetch(`/api/tree?treeId=${treeId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchTreeData(); // Refresh the tree data
        setSelectedNode(null); // Close the modal
      } else {
        console.error("Failed to delete relative");
      }
    } catch (error) {
      console.error("Error deleting relative:", error);
    }
  };

  const handleBackToDashboard = () => {
    if (typeof window !== "undefined") {
      window.location.href = `/admin/dashboard?user=${userId}`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 font-sans antialiased">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 sm:mb-12 gap-4">
          <button
            onClick={handleBackToDashboard}
            className="flex items-center space-x-2 px-4 py-2 bg-white text-gray-700 rounded-full shadow-md hover:bg-gray-100 transition-all duration-200 text-sm sm:text-base font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex flex-col items-center text-center flex-1">
            <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-800 tracking-tight leading-tight">
              Family Tree <span className="text-indigo-600">Builder</span>
            </h1>
            <p className="text-base sm:text-lg text-gray-500 mt-2">
              Visualize and manage your family connections with ease
            </p>
          </div>

          <div className="w-full sm:w-auto flex justify-center sm:justify-end">
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-full shadow-lg hover:bg-indigo-700 transition-all duration-200 text-base"
            >
              <Plus className="w-5 h-5" />
              <span>Add Relative</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-xl shadow-2xl p-4 sm:p-8 relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10 rounded-xl">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-4 border-indigo-500"></div>
            </div>
          )}

          {treeData.length === 0 && !loading && (
            <div className="text-center p-6 bg-blue-50 border border-blue-200 rounded-lg mb-8">
              <p className="text-blue-800 font-semibold text-lg">
                Your family tree is empty!
              </p>
              <p className="text-blue-600 text-md mt-2">
                Click "Add Relative" to start building your connections.
              </p>
            </div>
          )}

          <div
            className="relative flex justify-center w-full"
            ref={containerRef}
            style={{ minHeight: isMobile ? "500px" : "600px" }} // Ensure container has a minimum height
          >
            <svg
              ref={svgRef}
              width={svgDimensions.width}
              height={svgDimensions.height}
              className="rounded-lg touch-none bg-white"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Edges */}
              {edges.map((edge, index) => {
                const fromNode = nodes.find((n) => n.id === edge.from);
                const toNode = nodes.find((n) => n.id === edge.to);
                if (!fromNode || !toNode) return null;

                const midX = (fromNode.x + toNode.x) / 2;
                const midY = (fromNode.y + toNode.y) / 2;
                const labelWidth = isMobile ? 60 : 80;
                const labelHeight = isMobile ? 18 : 24;

                return (
                  <g key={index}>
                    <line
                      x1={fromNode.x}
                      y1={fromNode.y}
                      x2={toNode.x}
                      y2={toNode.y}
                      stroke="#A3A3A3" // Gray
                      strokeWidth="2"
                      className="transition-colors duration-200"
                    />
                    <rect
                      x={midX - labelWidth / 2}
                      y={midY - labelHeight / 2}
                      width={labelWidth}
                      height={labelHeight}
                      fill="#F8FAFC" // Light gray for label background
                      stroke="#CBD5E1" // Border for label
                      rx="6"
                      ry="6"
                      className="shadow-sm"
                    />
                    <text
                      x={midX}
                      y={midY + (isMobile ? 3 : 5)}
                      textAnchor="middle"
                      className={`${
                        isMobile ? "text-[10px]" : "text-xs"
                      } fill-gray-700 font-semibold uppercase tracking-wider`}
                    >
                      {edge.relationship}
                    </text>
                  </g>
                );
              })}

              {/* Nodes */}
              {nodes.map((node) => {
                const nodeRadius = node.isRoot
                  ? isMobile
                    ? 35
                    : 45
                  : isMobile
                  ? 30
                  : 40;
                const iconSize = node.isRoot
                  ? isMobile
                    ? 22
                    : 30
                  : isMobile
                  ? 18
                  : 24;
                const isHovered = hoveredNode === node.id;
                const nameTextLength = isMobile ? 9 : 12; // Max characters before truncation

                return (
                  <g
                    key={node.id}
                    className={
                      node.isRoot && !node.data
                        ? "cursor-default"
                        : "cursor-pointer"
                    }
                  >
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={nodeRadius}
                      fill={node.isRoot ? "#4F46E5" : "#10B981"} // Indigo for root, Green for others
                      stroke="#FFFFFF"
                      strokeWidth="4"
                      className={`transition-all duration-300 ease-in-out ${
                        isHovered
                          ? "ring-4 ring-indigo-400 shadow-2xl"
                          : "ring-0 shadow-md"
                      }`}
                      style={{
                        filter: isHovered
                          ? "drop-shadow(0 6px 12px rgba(0, 0, 0, 0.25))"
                          : "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))",
                      }}
                      onClick={() => handleNodeClick(node)}
                      onMouseDown={(e) => handleMouseDown(e, node.id)}
                      onTouchStart={(e) => handleTouchStart(e, node.id)}
                      onMouseEnter={() => setHoveredNode(node.id)}
                      onMouseLeave={() => setHoveredNode(null)}
                    />

                    {/* User icon */}
                    <User
                      x={node.x - iconSize / 2}
                      y={node.y - iconSize / 2}
                      width={iconSize}
                      height={iconSize}
                      className="fill-white pointer-events-none"
                    />

                    {/* Name label */}
                    <text
                      x={node.x}
                      y={node.y + nodeRadius + (isMobile ? 16 : 20)}
                      textAnchor="middle"
                      className={`${
                        isMobile ? "text-xs" : "text-sm"
                      } font-bold fill-gray-800 pointer-events-none`}
                    >
                      {node.name.length > nameTextLength
                        ? node.name.substring(0, nameTextLength) + "..."
                        : node.name}
                    </text>

                    {node.isRoot && (
                      <text
                        x={node.x}
                        y={node.y + nodeRadius + (isMobile ? 28 : 38)}
                        textAnchor="middle"
                        className={`${
                          isMobile ? "text-[10px]" : "text-xs"
                        } fill-indigo-700 font-medium pointer-events-none uppercase`}
                      >
                        (You)
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Node Details Modal */}
        {selectedNode && selectedNode.data && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-md transform scale-95 animate-scale-in">
              <div className="flex items-center justify-between mb-5 border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedNode.name}
                </h2>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Relationship
                  </label>
                  <p className="text-gray-900 text-lg capitalize font-semibold">
                    {selectedNode.data.relationship}
                  </p>
                </div>

                {selectedNode.data.profile_url && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Profile Link
                    </label>
                    <a
                      href={selectedNode.data.profile_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-base break-all underline transition-colors"
                    >
                      {selectedNode.data.profile_url}
                    </a>
                  </div>
                )}

                <div className="pt-5 border-t mt-5">
                  <button
                    onClick={() => deleteRelative(selectedNode.data!.tree_id)}
                    className="flex items-center space-x-2 text-red-600 hover:text-red-800 transition-colors font-medium text-base"
                  >
                    <Trash2 className="w-5 h-5" />
                    <span>Delete Relative</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Relative Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-md transform scale-95 animate-scale-in">
              <h2 className="text-2xl font-bold text-gray-900 mb-5 border-b pb-4">
                Add New Relative
              </h2>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="relativeName"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="relativeName"
                    value={newRelative.relativeName}
                    onChange={(e) =>
                      setNewRelative({
                        ...newRelative,
                        relativeName: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base outline-none transition-all duration-200"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="relationship"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Relationship <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="relationship"
                    value={newRelative.relationship}
                    onChange={(e) =>
                      setNewRelative({
                        ...newRelative,
                        relationship: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base bg-white outline-none appearance-none transition-all duration-200"
                    required
                  >
                    <option value="">Select relationship</option>
                    <option value="parent">Parent</option>
                    <option value="child">Child</option>
                    <option value="sibling">Sibling</option>
                    <option value="spouse">Spouse</option>
                    <option value="grandparent">Grandparent</option>
                    <option value="grandchild">Grandchild</option>
                    <option value="aunt">Aunt</option>
                    <option value="uncle">Uncle</option>
                    <option value="cousin">Cousin</option>
                    <option value="nephew">Nephew</option>
                    <option value="niece">Niece</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="profileUrl"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Profile Link (optional)
                  </label>
                  <input
                    type="url"
                    id="profileUrl"
                    value={newRelative.profileUrl}
                    onChange={(e) =>
                      setNewRelative({
                        ...newRelative,
                        profileUrl: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base outline-none transition-all duration-200"
                    placeholder="https://example.com/profile"
                  />
                </div>
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="w-full sm:flex-1 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={addRelative}
                    disabled={submitting}
                    className="w-full sm:flex-1 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed font-medium"
                  >
                    {submitting ? "Adding..." : "Add Relative"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tailwind CSS for animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes scale-in {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out forwards;
        }
        .animate-scale-in {
          animation: scale-in 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
      `}</style>
    </div>
  );
}
