# Async Data Patterns in Azoth

*Learnings from implementing async data loading in wre-dashboards*

---

## The Core Pattern: Channels

Azoth's `channel()` function connects async data sources to DOM rendering:

```jsx
import { channel } from 'azoth/chronos/channels';

// channel(asyncSource, transform, options)
channel(promise, Component, { start: <Loading /> });
```

When the async source resolves, the transform runs and the result replaces the loading content.

## Pattern: View + CardView

A clean separation emerged for dashboard components:

```jsx
// Pure view - accepts props, testable in isolation
export const AgentProfileView = ({ name, market, profileUrl }) => (
    <div class="agent-profile">
        <img src={profileUrl} alt={name} />
        <span>{name}</span>
    </div>
);

// Async wrapper - composes view with card + loading behavior
export const AgentProfile = ({ async }) => (
    <CardView class="agent-profile" async={async} Component={AgentProfileView} loadingHeight="2em" />
);
```

**Benefits:**
- `View` is pure and testable with mock props
- `CardView` handles all async complexity (channel, loading state)
- Clean separation of concerns

## The CardView Implementation

```jsx
function Loading({ height }) {
    return <div style={`min-height: ${height}`}>Loading...</div>;
}

function AsyncView({ Component, async, loadingHeight }) {
    return channel(async, Component, { start: <Loading height={loadingHeight} /> });
}

const Card2 = ({ class: className }, slottable) => (
    <div className={`card${className ? ` ${className}` : ''}`}>{slottable}</div>
);

export function CardView({ async, Component, loadingHeight, class: className }) {
    return <Card2 class={className}>
        <AsyncView Component={Component} async={async} loadingHeight={loadingHeight} />
    </Card2>;
}
```

**Key decisions:**
- `loadingHeight` passed through CardView → AsyncView → Loading
- Each component specifies its expected height for loading state
- `Loading` uses the generic `height` prop (contextually clear)

## Data Fetching Ownership

Data fetching lives in `main.jsx`, not in components:

```jsx
// main.jsx
import { getAgentInfo } from './data/agent.js';

<AgentProfile async={getAgentInfo()} />
```

**Why:**
- Components stay pure (receive async, don't fetch)
- Shared data easy to handle (e.g., `Promise.all` for GoalScorecard)
- Data orchestration visible in one place

## The `async` Prop Convention

Components accept `async` as the prop name:

```jsx
<AgentProfile async={getAgentInfo()} />
<GoalScorecard async={scorecardData$} />
```

**Why `async` over domain names like `agent$`:**
- Communicates how the prop is used (it's the async data source)
- Consistent across all components
- The component name already indicates the domain

## Naming Conventions

- **`$` suffix**: Indicates an async value (promise/stream). E.g., `agent$`, `scorecard$`
- **`View` suffix**: Pure presentational component. E.g., `AgentProfileView`
- **`loadingHeight`**: API-facing prop name (explicit intent)
- **`height`**: Internal to Loading component (contextually obvious)

## Channel Options

From exploring the channel API:

```jsx
channel(async, transform, {
    start: <Loading />,  // Render immediately before async resolves (not transformed)
    init: initialValue,  // Initial value that DOES go through transform
    map: true,           // Map transform over arrays
});
```

- `start` = arbitrary loading UI
- `init` = initial data value (transformed)
- Use `start` for loading spinners, `init` for default data

## Testing Strategy

- **Unit test the View**: Pass mock props directly
- **Integration test the full component**: Would need async handling

```jsx
// Direct view testing
test('AgentProfileView', () => {
    expect(getHTML(<AgentProfileView {...agentData} />)).toMatchSnapshot();
});
```

## Open Questions

1. **Error handling**: Where do fetch errors get caught? Transform function? Channel built-in?
2. **Subscription cleanup**: How do channel subscriptions get cleaned up when DOM is removed?
3. **Multiple async sources**: For components needing multiple data sources, use `Promise.all` at call site or a combining pattern?

---

*Captured from wre-dashboards async integration work, January 2026*
