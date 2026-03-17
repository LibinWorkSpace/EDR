# NEXUS.EDR - Endpoint Detection and Response Platform

## Overview

**NEXUS.EDR** is a comprehensive cybersecurity monitoring platform that simulates real-time endpoint detection and response capabilities. This system demonstrates advanced threat detection, process monitoring, and automated incident response in a Linux environment using simulated eBPF telemetry data.

The platform provides security analysts with real-time visibility into system activities, automated anomaly detection using machine learning algorithms, and coordinated response capabilities to neutralize threats.

## System Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Linux         │    │   NEXUS.EDR      │    │   Security      │
│   Endpoints     │───▶│   Platform       │───▶│   Operations    │
│   (eBPF Sensor) │    │   (Detection)    │    │   Center        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Technology Stack

**Frontend (React + TypeScript)**
- **Framework**: React 19.2.4 with TypeScript
- **Build Tool**: Vite 8.0.0
- **State Management**: Zustand 5.0.12
- **Routing**: React Router DOM 7.13.1
- **UI Components**: Lucide React (icons)
- **Styling**: Tailwind CSS 3.4.19
- **Data Visualization**: Recharts 3.8.0
- **Process Visualization**: React Flow 11.11.4
- **Testing**: Vitest 4.1.0 with Property-Based Testing (fast-check)

**Backend (Node.js + Express)**
- **Runtime**: Node.js with TypeScript
- **Framework**: Express 5.2.1
- **Development**: TSX 4.21.0 (TypeScript execution)
- **CORS**: Enabled for cross-origin requests
- **Data Storage**: In-memory store with versioning

## Core Features

### 1. Real-Time Telemetry Collection
- **Event Types**: PROCESS_EXEC, NETWORK_CONNECT, FILE_OPEN
- **Data Source**: Simulated Linux eBPF sensor data
- **Streaming**: Server-Sent Events (SSE) for real-time updates
- **Event Buffer**: Maintains last 500 events for performance

### 2. Process Tree Reconstruction
- **Hierarchical Visualization**: Parent-child process relationships
- **Interactive Graph**: React Flow-based process tree explorer
- **Real-Time Updates**: Dynamic tree growth and mutation
- **Process Metadata**: PID, PPID, UID, executable path, command line

### 3. Machine Learning-Based Anomaly Detection
- **Algorithm**: Isolation Forest implementation
- **Feature Engineering**: 5-dimensional analysis
  - **Tree Depth**: Process hierarchy depth
  - **Execution Breadth**: Concurrent child processes
  - **CLI Entropy**: Command-line randomness scoring
  - **Temporal Rate**: Process spawning velocity
  - **Privilege Transition**: UID escalation detection
- **Scoring**: 0-1 anomaly score with 0.75 threshold
- **Real-Time Analysis**: Continuous background scoring

### 4. Automated Incident Response
- **Response Actions**:
  - `kill_process`: Terminate malicious processes
  - `isolate_host`: Network isolation
  - `alert_soc`: Security Operations Center notification
- **Action Logging**: Complete audit trail
- **Alert Management**: Dynamic alert lifecycle

### 5. Live Data Pipeline
- **Background Simulation**: Realistic attack scenario generation
- **Process Growth**: Dynamic tree expansion
- **Data Retirement**: Automatic cleanup of old data
- **Version Tracking**: State synchronization across components

## System Components

### Frontend Pages

#### 1. Dashboard (`/`)
- **Purpose**: System overview and health monitoring
- **Features**:
  - Real-time metrics display
  - Pipeline architecture visualization
  - System status indicators
  - Active/inactive streaming status
- **Key Metrics**: Active processes, alerts, detection rate, system uptime

#### 2. Live Telemetry (`/telemetry`)
- **Purpose**: Real-time event stream monitoring
- **Features**:
  - Live event feed with SSE connection
  - Event type filtering (ALL, PROCESS_EXEC, NETWORK_CONNECT, FILE_OPEN)
  - Color-coded event types
  - Timestamp and process metadata display
- **Data Flow**: Backend SSE → Frontend event buffer → UI updates

#### 3. Process Graph (`/process-tree`)
- **Purpose**: Interactive process tree visualization
- **Features**:
  - React Flow-based interactive graph
  - Tree selection and navigation
  - Anomalous process highlighting
  - Process metadata tooltips
  - Real-time tree updates
- **Visualization**: Hierarchical node layout with cyber-themed styling

#### 4. Detections (`/detection`)
- **Purpose**: Anomaly detection results and analysis
- **Features**:
  - Real-time anomaly scoring
  - Circular gauge visualizations
  - Feature breakdown display
  - Alert threshold monitoring
  - Detection history tracking
- **ML Pipeline**: Feature extraction → Isolation Forest → Anomaly scoring

#### 5. Response (`/response`)
- **Purpose**: Incident response and alert management
- **Features**:
  - Active alert dashboard
  - Response action execution
  - Action history and audit log
  - Alert resolution tracking
  - Automated alert archival

### Backend API Routes

#### 1. Telemetry API (`/api/telemetry`)
- **GET /**: Retrieve recent telemetry events
- **GET /stream**: Server-Sent Events stream
- **Purpose**: Real-time event data distribution

#### 2. Process Tree API (`/api/process-tree`)
- **GET /**: Fetch current process trees
- **GET /stream**: Real-time tree updates
- **Purpose**: Process hierarchy data management

#### 3. Detection API (`/api/detection`)
- **GET /**: Anomaly detection results
- **GET /stream**: Real-time detection updates
- **Purpose**: ML-based threat detection

#### 4. Response API (`/api/response`)
- **POST /**: Execute response actions
- **GET /log**: Retrieve action history
- **Purpose**: Incident response coordination

#### 5. Retirement API (`/api/retirement`)
- **POST /**: Manual data cleanup
- **Purpose**: System maintenance and optimization

## Data Flow Architecture

### 1. Telemetry Ingestion Pipeline
```
eBPF Events → Event Buffer → SSE Stream → Frontend Store → UI Components
```

### 2. Process Tree Construction
```
PROCESS_EXEC Events → Tree Builder → Hierarchy Store → Graph Visualization
```

### 3. Anomaly Detection Pipeline
```
Process Trees → Feature Engineering → Isolation Forest → Anomaly Scores → Alerts
```

### 4. Response Workflow
```
Alerts → User Action → API Call → Process Termination → Action Log → UI Update
```

## Component Interconnections

### State Management (Zustand Store)
- **Global State**: Centralized data management
- **Real-Time Updates**: SSE integration
- **Data Synchronization**: Cross-component state sharing
- **Store Modules**:
  - `events`: Telemetry event buffer
  - `processTrees`: Process hierarchy data
  - `detections`: Anomaly detection results
  - `alerts`: Active security alerts
  - `actionLog`: Response action history
  - `isStreaming`: System status

### Component Communication
- **Parent-Child**: Props and callbacks
- **Global State**: Zustand store subscriptions
- **Real-Time**: SSE connections
- **API Integration**: REST endpoints

### Navigation Flow
```
Dashboard → Overview → Telemetry → Live Events → Process Graph → Tree Analysis
    ↓                                                                    ↓
Response ← Alert Management ← Detection ← Anomaly Analysis ← Feature Engineering
```

## Parameters and Constraints

### Performance Parameters
- **Event Buffer Size**: 500 events maximum
- **Update Frequency**: 1-second intervals
- **Tree Depth Limit**: 10 levels maximum
- **Alert Retention**: 10 minutes for resolved alerts
- **Memory Management**: Automatic data retirement

### Detection Thresholds
- **Anomaly Score**: 0.75 threshold for alerts
- **Tree Depth**: >4 levels considered suspicious
- **Execution Breadth**: >8 concurrent children flagged
- **CLI Entropy**: >5 entropy score triggers analysis
- **Temporal Rate**: <100ms spawning rate suspicious
- **Privilege Escalation**: UID 0 transitions monitored

### System Constraints
- **Browser Compatibility**: Modern browsers with SSE support
- **Network Requirements**: HTTP/HTTPS for API communication
- **Memory Usage**: Client-side event buffering
- **Real-Time Dependency**: SSE connection stability

## Workflow Operations

### 1. System Startup Workflow
1. **Backend Initialization**
   - Express server startup (port 3001)
   - CORS configuration
   - Route registration
   - Background simulation start

2. **Frontend Initialization**
   - React application mount
   - Zustand store initialization
   - Router configuration
   - SSE connection establishment

### 2. Real-Time Monitoring Workflow
1. **Event Generation**: Background simulator creates telemetry
2. **Event Processing**: Backend processes and stores events
3. **Stream Distribution**: SSE pushes updates to frontend
4. **UI Updates**: Components re-render with new data
5. **State Synchronization**: Global store updates

### 3. Threat Detection Workflow
1. **Process Tree Analysis**: Extract process hierarchies
2. **Feature Engineering**: Calculate 5-dimensional features
3. **Anomaly Scoring**: Apply Isolation Forest algorithm
4. **Alert Generation**: Create alerts for high-risk processes
5. **UI Notification**: Display alerts in Response page

### 4. Incident Response Workflow
1. **Alert Review**: Security analyst examines alerts
2. **Action Selection**: Choose appropriate response action
3. **API Execution**: Send response command to backend
4. **Process Termination**: Execute kill_process or isolation
5. **Audit Logging**: Record action in system log
6. **Alert Resolution**: Mark alert as resolved

### 5. Data Lifecycle Management
1. **Data Generation**: Continuous telemetry creation
2. **Storage Management**: In-memory data structures
3. **Automatic Retirement**: Remove old/large process trees
4. **Alert Archival**: Clean up resolved alerts
5. **Performance Optimization**: Memory usage control

## Security Considerations

### Threat Simulation
- **Attack Scenarios**: Reverse shells, web exploitation, privilege escalation
- **Realistic Patterns**: Based on actual attack techniques
- **Dynamic Behavior**: Evolving threat landscapes

### Detection Capabilities
- **Behavioral Analysis**: Process execution patterns
- **Anomaly Detection**: Statistical deviation identification
- **Real-Time Monitoring**: Immediate threat visibility
- **False Positive Management**: Threshold tuning

## Development and Testing

### Development Environment
- **Frontend**: `npm run dev` (Vite development server)
- **Backend**: `npm run dev` (TSX watch mode)
- **Testing**: `npm run test` (Vitest test runner)

### Testing Strategy
- **Property-Based Testing**: fast-check integration
- **Unit Testing**: Component and function testing
- **Integration Testing**: API endpoint validation
- **UI Testing**: Component interaction testing

## Deployment Considerations

### Production Requirements
- **Node.js**: Runtime environment
- **Process Management**: PM2 or similar
- **Reverse Proxy**: Nginx for production serving
- **SSL/TLS**: HTTPS encryption
- **Monitoring**: Application performance monitoring

### Scalability
- **Horizontal Scaling**: Multiple backend instances
- **Load Balancing**: Request distribution
- **Database Integration**: Persistent storage option
- **Caching**: Redis for session management

---

**Version**: 1.0.4-beta  
**Status**: SIMULATION  
**License**: ISC  
**Maintainer**: Development Team