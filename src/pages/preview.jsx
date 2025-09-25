import React from 'react'
import { useTheme } from '@/hooks/useTheme'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Sun,
  Moon,
  Monitor,
  Palette,
  Eye,
  Code,
  Lightbulb
} from 'lucide-react'

const Preview = () => {
  const {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
    cycleTheme,
    isDark,
    isLight,
    isSystem,
    themes
  } = useTheme()

  const getThemeIcon = (themeType) => {
    switch (themeType) {
      case themes.LIGHT:
        return <Sun className="h-4 w-4" />
      case themes.DARK:
        return <Moon className="h-4 w-4" />
      case themes.SYSTEM:
        return <Monitor className="h-4 w-4" />
      default:
        return <Palette className="h-4 w-4" />
    }
  }

  const getStatusColor = (condition) => {
    return condition ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Palette className="h-8 w-8 text-blue-500" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Theme Hook Preview
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Interactive demonstration of the useTheme custom hook
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Theme Controls */}
          <Card className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <Code className="h-5 w-5 text-blue-500" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Theme Controls
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  Current Theme Settings:
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline" className="flex items-center gap-1">
                    {getThemeIcon(theme)}
                    Selected: {theme}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    Resolved: {resolvedTheme}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  Set Specific Theme:
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    onClick={() => setTheme(themes.LIGHT)}
                    variant={theme === themes.LIGHT ? "default" : "outline"}
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Sun className="h-4 w-4" />
                    Light
                  </Button>
                  <Button
                    onClick={() => setTheme(themes.DARK)}
                    variant={theme === themes.DARK ? "default" : "outline"}
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Moon className="h-4 w-4" />
                    Dark
                  </Button>
                  <Button
                    onClick={() => setTheme(themes.SYSTEM)}
                    variant={theme === themes.SYSTEM ? "default" : "outline"}
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Monitor className="h-4 w-4" />
                    System
                  </Button>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  Quick Actions:
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    onClick={toggleTheme}
                    variant="outline"
                    className="flex items-center gap-1"
                  >
                    <Lightbulb className="h-4 w-4" />
                    Toggle Theme
                  </Button>
                  <Button
                    onClick={cycleTheme}
                    variant="outline"
                    className="flex items-center gap-1"
                  >
                    <Palette className="h-4 w-4" />
                    Cycle All
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Theme Status */}
          <Card className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="h-5 w-5 text-green-500" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Theme Status
              </h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">isDark:</span>
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(isDark)}`} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">isLight:</span>
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(isLight)}`} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">isSystem:</span>
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(isSystem)}`} />
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  Hook Return Values:
                </p>
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md font-mono text-xs">
                  <div className="text-gray-700 dark:text-gray-300">
                    theme: "{theme}"<br/>
                    resolvedTheme: "{resolvedTheme}"<br/>
                    isDark: {isDark.toString()}<br/>
                    isLight: {isLight.toString()}<br/>
                    isSystem: {isSystem.toString()}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Visual Demo */}
        <Card className="mt-6 p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Visual Theme Demo
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Background Colors</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                This section demonstrates responsive background colors that change with the theme.
              </p>
            </div>

            <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Border Styles</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Borders and dividers adapt automatically to maintain proper contrast.
              </p>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Accent Colors</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Accent colors maintain accessibility across all theme modes.
              </p>
            </div>
          </div>
        </Card>

        {/* Usage Example */}
        <Card className="mt-6 p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Usage Example
          </h2>

          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md">
            <pre className="text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
{`import { useTheme } from '@/hooks/useTheme'

const MyComponent = () => {
  const { isDark, toggleTheme, resolvedTheme } = useTheme()

  return (
    <div className="bg-white dark:bg-gray-900">
      <p>Current theme: {resolvedTheme}</p>
      <button onClick={toggleTheme}>
        {isDark ? 'Switch to Light' : 'Switch to Dark'}
      </button>
    </div>
  )
}`}
            </pre>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default Preview