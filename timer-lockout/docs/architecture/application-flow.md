# Application Flow

This document describes the detailed application flow of the Timer Lockout Application, including initialization, user interactions, and state transitions.

---

## 🚀 Initialization Flow

### Application Startup Sequence

```mermaid
sequenceDiagram
    participant B as Browser
    participant I as index.html
    participant M as main.tsx
    participant A as App.tsx
    participant T as useTimer
    participant R as React
    
    B->>I: Load HTML (GET /)
    I->>M: Load main.tsx via script tag
    M->>R: Call ReactDOM.createRoot
    R->>A: Render App component
    A->>T: Initialize useTimer hook
    T->>T: Set initial state
    T->>T: status = 'idle'
    T->>T: remainingTime = 180
    T->>T: isButtonEnabled = true
    T->>A: Return initial state
    A->>R: Render UI with initial state
    R->>B: Update DOM
    B->>U: Display application
```

### Detailed Initialization Steps

1. **Browser Request**
   - User navigates to application URL
   - Browser requests `index.html`
   - Server returns HTML file

2. **HTML Parsing**
   - Browser parses `index.html`
   - Loads CSS files (if any)
   - Loads JavaScript module (`main.tsx`)

3. **Module Loading**
   - Vite development server serves `main.tsx`
   - Browser downloads and executes the module
   - TypeScript is compiled to JavaScript

4. **React Initialization**
   - `main.tsx` calls `ReactDOM.createRoot()`
   - React initializes and renders `App.tsx`
   - React creates virtual DOM

5. **Component Mounting**
   - `App.tsx` component mounts
   - Custom hooks initialize (`useTimer`)
   - Initial state is set
   - Components render with initial state

6. **UI Display**
   - React updates browser DOM
   - Application becomes visible
   - User can interact with UI

---

## 🖱️ User Interaction Flow

### Start Timer Flow

```mermaid
sequenceDiagram
    participant U as User
    participant B as Browser
    participant A as App
    participant T as useTimer
    participant S as State
    
    U->>B: Click Start Button
    B->>A: Trigger onClick
    A->>A: Check if button enabled
    alt Button Disabled
        A->>B: Ignore click
    else Button Enabled
        A->>T: Call start()
        T->>S: Clear any existing timer
        S-->>T: Timer cleared
        T->>T: Get current time (Date.now())
        T->>S: Set startTime = current time
        S-->>T: startTime set
        T->>S: Set status = 'running'
        S-->>T: status set
        T->>S: Set isButtonEnabled = false
        S-->>T: isButtonEnabled set
        T->>B: Start interval (100ms)
        B-->>T: Return interval ID
        T->>T: Store interval ID
        T->>A: Return new state
        A->>A: Re-render with new state
        A->>B: Update DOM
        B->>U: Show running timer
    end
```

### Timer Tick Flow

```mermaid
sequenceDiagram
    participant B as Browser
    participant T as useTimer
    participant S as State
    participant A as App
    
    loop Every 100ms
        B->>T: Execute interval callback
        T->>B: Get current time (Date.now())
        B-->>T: Return current time
        T->>T: Calculate elapsed = current - startTime
        T->>T: Calculate remaining = lockoutDuration - elapsed
        T->>S: Update remainingTime
        S-->>T: remainingTime updated
        alt remainingTime > 0
            T->>A: Return updated state
            A->>A: Re-render
            A->>B: Update DOM
        else remainingTime <= 0
            T->>B: Clear interval
            B-->>T: Interval cleared
            T->>S: Set status = 'locked'
            S-->>T: status set
            T->>S: Set lockoutEndTime = Date.now() + lockoutDuration * 1000
            S-->>T: lockoutEndTime set
            T->>T: Emit COMPLETE event
            T->>T: Emit LOCKOUT_START event
            T->>A: Return locked state
            A->>A: Re-render
            A->>B: Update DOM
            B->>U: Show lockout message
        end
    end
```

### Lockout Period Flow

```mermaid
sequenceDiagram
    participant B as Browser
    participant T as useTimer
    participant S as State
    participant A as App
    
    Note over T: Lockout period active
    
    B->>T: 1 second interval (lockout check)
    T->>B: Get current time (Date.now())
    B-->>T: Return current time
    T->>T: Check if current >= lockoutEndTime
    alt current < lockoutEndTime
        T->>T: Do nothing
    else current >= lockoutEndTime
        T->>S: Set status = 'idle'
        S-->>T: status set
        T->>S: Set remainingTime = lockoutDuration
        S-->>T: remainingTime set
        T->>S: Set startTime = null
        S-->>T: startTime set
        T->>S: Set lockoutEndTime = null
        S-->>T: lockoutEndTime set
        T->>S: Set isButtonEnabled = true
        S-->>T: isButtonEnabled set
        T->>T: Emit LOCKOUT_END event
        T->>A: Return idle state
        A->>A: Re-render
        A->>B: Update DOM
        B->>U: Show ready state
    end
```

### Reset Timer Flow

```mermaid
sequenceDiagram
    participant U as User
    participant B as Browser
    participant A as App
    participant T as useTimer
    participant S as State
    
    U->>B: Click Reset Button
    B->>A: Trigger onClick
    A->>A: Check if button enabled
    alt Button Disabled
        A->>B: Ignore click
    else Button Enabled
        A->>T: Call reset()
        T->>B: Clear interval (if running)
        B-->>T: Interval cleared
        T->>S: Set status = 'idle'
        S-->>T: status set
        T->>S: Set remainingTime = lockoutDuration
        S-->>T: remainingTime set
        T->>S: Set startTime = null
        S-->>T: startTime set
        T->>S: Set lockoutEndTime = null
        S-->>T: lockoutEndTime set
        T->>S: Set isButtonEnabled = true
        S-->>T: isButtonEnabled set
        T->>T: Emit RESET event
        T->>A: Return idle state
        A->>A: Re-render
        A->>B: Update DOM
        B->>U: Show ready state
    end
```

---

## 🎯 State Transition Flow

### Complete State Machine Flow

```mermaid
stateDiagram-v2
    direction LR
    
    [*] --> Idle: Initial State
    
    state Idle {
        Ready: Button Enabled
        
        Ready --> LockedOut: reset() called after lockout
    }
    
    state Running {
        CountingDown: Timer Active
        
        CountingDown --> Locked: Time reaches 0
    }
    
    state Locked {
        LockoutActive: Lockout Period
        WaitingForReset: Button Disabled
        
        LockoutActive --> Idle: Lockout expires
        LockoutActive --> Idle: unlock() called
        LockoutActive --> Idle: reset() called
    }
    
    Idle --> Running: start() called
    Running --> Idle: reset() called
    
    note right of Idle
        UI: Ready to Start
        Button: ENABLED
        Display: 3:00
        Status: "Ready"
        Progress: 0%
    end note
    
    note right of Running
        UI: Timer Running
        Button: DISABLED
        Display: Counting down
        Status: "Running"
        Progress: 0-100%
    end note
    
    note right of Locked
        UI: Lockout Active
        Button: DISABLED
        Display: 0:00
        Status: "Locked"
        Message: "Lockout active - Press button to reset"
        Progress: 100%
    end note
```

---

## 📊 Event Flow

### Timer Events

```mermaid
graph LR
    A[User Action] --> B{Action Type}
    B -->|Start| C[useTimer.start()]
    B -->|Reset| D[useTimer.reset()]
    B -->|Unlock| E[useTimer.unlock()]
    
    C --> F[Set status: running]
    C --> G[Start interval]
    C --> H[Emit START event]
    
    D --> I[Clear interval]
    D --> J[Set status: idle]
    D --> K[Set remainingTime: 180]
    D --> L[Emit RESET event]
    
    E --> M[Clear interval]
    E --> N[Set status: idle]
    E --> O[Set isButtonEnabled: true]
    E --> P[Emit LOCKOUT_END event]
    
    G --> Q[100ms interval]
    Q --> R{Time remaining?}
    R -->|> 0| S[Continue counting]
    R -->|= 0| T[Transition to locked]
    T --> U[Clear interval]
    U --> V[Set lockoutEndTime]
    V --> W[Emit COMPLETE event]
    W --> X[Emit LOCKOUT_START event]
    
    style A fill:#f9f,stroke:#333
    style H fill:#bbf,stroke:#333
    style L fill:#bbf,stroke:#333
    style P fill:#bbf,stroke:#333
    style W fill:#bbf,stroke:#333
```

### Event Subscription Flow

```mermaid
sequenceDiagram
    participant C as Component
    participant T as useTimer
    participant E as Event Listener
    
    C->>T: Call subscribe(callback)
    T->>T: Add callback to listeners set
    T->>C: Return unsubscribe function
    
    Note over T: Event occurs (e.g., START)
    T->>T: For each listener
    T->>E: Call listener with event
    E->>E: Handle event
```

---

## 🎨 Render Flow

### Component Render Flow

```mermaid
flowchart TD
    A[App.tsx] --> B[State from useTimer]
    B --> C{Status}
    
    C -->|idle| D[Show Ready State]
    C -->|running| E[Show Running Timer]
    C -->|locked| F[Show Lockout Message]
    
    D --> G[Enable Start Button]
    D --> H[Show 3:00]
    D --> I[Hide Lockout Message]
    
    E --> J[Disable Button]
    E --> K[Show Countdown]
    E --> L[Show Progress Ring]
    
    F --> M[Disable Button]
    F --> N[Show 0:00]
    F --> O[Show Lockout Message]
    
    G --> P[Button: "Start Timer"]
    J --> Q[Button: "Reset Timer"]
    M --> R[Button: "Reset Timer"]
```

### Data Display Flow

```mermaid
flowchart TD
    A[useTimer State] --> B[remainingTime]
    A --> C[status]
    A --> D[getProgress()]
    A --> E[getFormattedTime()]
    
    B --> F[TimerDisplay: time prop]
    C --> F[TimerDisplay: status prop]
    D --> G[ProgressRing: progress prop]
    E --> H[Technical Details: remaining time]
    
    F --> I[Display formatted time]
    F --> J[Apply status-specific styling]
    G --> K[Render progress ring]
    H --> L[Display in details card]
```

---

## 📈 Performance Flow

### Initial Load Performance

```mermaid
flowchart TD
    A[Browser Request] --> B[Load index.html]
    B --> C[Parse HTML]
    C --> D[Load CSS]
    D --> E[Load JavaScript]
    E --> F[Execute JavaScript]
    F --> G[React Hydration]
    G --> H[Initial Render]
    
    B -->|Preload| I[Preload JS]
    I --> E
    
    D -->|Critical| J[Render-blocking]
    E -->|Defer| K[Non-blocking]
```

### Optimization Techniques

1. **Code Splitting**
   - Vendor chunk: React and dependencies
   - Application chunk: Application code
   - Benefits: Parallel loading, better caching

2. **Tree Shaking**
   - Remove unused code
   - Benefits: Smaller bundle size

3. **Minification**
   - Minify JavaScript and CSS
   - Benefits: Smaller file sizes, faster downloads

4. **CSS Purging**
   - Remove unused Tailwind classes
   - Benefits: Smaller CSS bundle

5. **Asset Hashing**
   - Content-based filenames
   - Benefits: Cache busting, long cache times

---

## 🔗 Related Documentation

- [system-overview.md](./system-overview.md) - System overview
- [data-flow.md](./data-flow.md) - Data flow details
- [state-management.md](./state-management.md) - State management details
- [error-handling.md](./error-handling.md) - Error handling details
- [decisions.md](./decisions.md) - Architectural decisions
- [../ARCHITECTURE.md](../ARCHITECTURE.md) - Main architecture documentation
- [../PROJECT_STRUCTURE.md](../PROJECT_STRUCTURE.md) - Project structure
