# ⌨️ Github CLI Action

This action will setup the [Github CLI](https://github.com/cli/cli).

## 🖥️ Usage Example

```yaml
jobs:
  setup-cli:
    name: Deploy
    runs-on: [self-hosted, linux, arm64, lightweight]
    steps:
      - name: Setup Github CLI
        uses: sportalliance/setup-gh-cli@main
```
