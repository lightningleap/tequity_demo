import React, { useState } from 'react'
import { useTheme } from '@/hooks/useTheme'
import { Button } from '@/components/ui/button'
import { CustomButton } from '@/components/ui/customButton'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter
} from '@/components/ui/modal'
import {
  Sun,
  Moon,
  Monitor,
  Palette,
  Eye,
  Code,
  Lightbulb,
  Settings,
  AlertTriangle,
  CheckCircle
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

  // Modal state management
  const [modals, setModals] = useState({
    basic: false,
    withHeader: false,
    confirmation: false,
    smallModal: false,
    largeModal: false,
    lightBackdrop: false,
    darkBackdrop: false,
    noClose: false
  })

  const openModal = (modalName) => {
    setModals(prev => ({ ...prev, [modalName]: true }))
  }

  const closeModal = (modalName) => {
    setModals(prev => ({ ...prev, [modalName]: false }))
  }

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

        {/* CustomButton Demo */}
        <Card className="mt-6 p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            CustomButton Component Demo
          </h2>

          <div className="space-y-6">
            {/* Variants Demo */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Variants</h3>
              <div className="flex flex-wrap gap-3">
                <CustomButton variant="primary">Primary</CustomButton>
                <CustomButton variant="secondary">Secondary</CustomButton>
                <CustomButton variant="success">Success</CustomButton>
                <CustomButton variant="warning">Warning</CustomButton>
                <CustomButton variant="danger">Danger</CustomButton>
                <CustomButton variant="outline">Outline</CustomButton>
                <CustomButton variant="ghost">Ghost</CustomButton>
                <CustomButton variant="neon">Neon</CustomButton>
              </div>
            </div>

            <Separator />

            {/* Sizes Demo */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Sizes</h3>
              <div className="flex flex-wrap items-center gap-3">
                <CustomButton size="xs" variant="primary">Extra Small</CustomButton>
                <CustomButton size="sm" variant="primary">Small</CustomButton>
                <CustomButton size="default" variant="primary">Default</CustomButton>
                <CustomButton size="lg" variant="primary">Large</CustomButton>
                <CustomButton size="xl" variant="primary">Extra Large</CustomButton>
              </div>
            </div>

            <Separator />

            {/* Shapes Demo */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Shapes</h3>
              <div className="flex flex-wrap gap-3">
                <CustomButton shape="default" variant="primary">Default</CustomButton>
                <CustomButton shape="rounded" variant="success">Rounded</CustomButton>
                <CustomButton shape="square" variant="warning">Square</CustomButton>
              </div>
            </div>

            <Separator />

            {/* With Icons Demo */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">With Icons</h3>
              <div className="flex flex-wrap gap-3">
                <CustomButton variant="primary">
                  <Sun className="h-4 w-4" />
                  Light Mode
                </CustomButton>
                <CustomButton variant="secondary">
                  <Moon className="h-4 w-4" />
                  Dark Mode
                </CustomButton>
                <CustomButton variant="success">
                  <Eye className="h-4 w-4" />
                  Preview
                </CustomButton>
                <CustomButton size="icon" variant="outline">
                  <Palette className="h-4 w-4" />
                </CustomButton>
              </div>
            </div>

            <Separator />

            {/* Interactive Examples */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Interactive Examples</h3>
              <div className="flex flex-wrap gap-3">
                <CustomButton
                  variant="primary"
                  onClick={() => alert('Primary clicked!')}
                >
                  Click Me
                </CustomButton>
                <CustomButton
                  variant="neon"
                  size="lg"
                  onClick={toggleTheme}
                >
                  <Lightbulb className="h-4 w-4" />
                  Toggle Theme
                </CustomButton>
                <CustomButton
                  variant="danger"
                  disabled
                >
                  Disabled
                </CustomButton>
              </div>
            </div>
          </div>
        </Card>

        {/* Modal Component Demo */}
        <Card className="mt-6 p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Modal Component Demo
          </h2>

          <div className="space-y-6">
            {/* Basic Modal Triggers */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Basic Modals</h3>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => openModal('basic')} variant="outline">
                  Basic Modal
                </Button>
                <Button onClick={() => openModal('withHeader')} variant="outline">
                  With Header & Footer
                </Button>
                <Button onClick={() => openModal('confirmation')} variant="destructive">
                  Confirmation Modal
                </Button>
              </div>
            </div>

            <Separator />

            {/* Size Variants */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Size Variants</h3>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => openModal('smallModal')} variant="outline" size="sm">
                  Small Modal
                </Button>
                <Button onClick={() => openModal('largeModal')} variant="outline" size="lg">
                  Large Modal
                </Button>
              </div>
            </div>

            <Separator />

            {/* Backdrop Variants */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Backdrop Variants</h3>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => openModal('lightBackdrop')} variant="ghost">
                  Light Backdrop
                </Button>
                <Button onClick={() => openModal('darkBackdrop')} variant="ghost">
                  Dark Backdrop
                </Button>
                <Button onClick={() => openModal('noClose')} variant="secondary">
                  No Close Button
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Modal Components */}
        {/* Basic Modal */}
        <Modal
          isOpen={modals.basic}
          onClose={() => closeModal('basic')}
        >
          <ModalBody>
            <div className="py-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Basic Modal
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                This is a simple modal with just a body content. Perfect for displaying quick information or simple forms.
              </p>
            </div>
          </ModalBody>
        </Modal>

        {/* Modal with Header and Footer */}
        <Modal
          isOpen={modals.withHeader}
          onClose={() => closeModal('withHeader')}
        >
          <ModalHeader>
            <ModalTitle>Modal with Header & Footer</ModalTitle>
            <ModalDescription>
              This modal demonstrates the complete structure with header, body, and footer components.
            </ModalDescription>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                You can include any content here. Forms, images, lists, or any other React components.
              </p>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Example content area with different styling.
                </p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={() => closeModal('withHeader')}>
              Cancel
            </Button>
            <Button onClick={() => closeModal('withHeader')}>
              Save Changes
            </Button>
          </ModalFooter>
        </Modal>

        {/* Confirmation Modal */}
        <Modal
          isOpen={modals.confirmation}
          onClose={() => closeModal('confirmation')}
          size="sm"
        >
          <ModalHeader>
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <ModalTitle>Confirm Action</ModalTitle>
                <ModalDescription>
                  Are you sure you want to delete this item? This action cannot be undone.
                </ModalDescription>
              </div>
            </div>
          </ModalHeader>
          <ModalFooter>
            <Button variant="outline" onClick={() => closeModal('confirmation')}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => closeModal('confirmation')}>
              Delete
            </Button>
          </ModalFooter>
        </Modal>

        {/* Small Modal */}
        <Modal
          isOpen={modals.smallModal}
          onClose={() => closeModal('smallModal')}
          size="sm"
        >
          <ModalHeader>
            <ModalTitle>Small Modal</ModalTitle>
          </ModalHeader>
          <ModalBody>
            <p className="text-gray-600 dark:text-gray-300">
              This is a compact modal perfect for simple confirmations or brief messages.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => closeModal('smallModal')}>
              Got it
            </Button>
          </ModalFooter>
        </Modal>

        {/* Large Modal */}
        <Modal
          isOpen={modals.largeModal}
          onClose={() => closeModal('largeModal')}
          size="lg"
        >
          <ModalHeader>
            <ModalTitle>Large Modal</ModalTitle>
            <ModalDescription>
              This larger modal can accommodate more content and complex layouts.
            </ModalDescription>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Enter your name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Enter your email"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Message
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  rows={4}
                  placeholder="Enter your message"
                ></textarea>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={() => closeModal('largeModal')}>
              Cancel
            </Button>
            <Button onClick={() => closeModal('largeModal')}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Submit
            </Button>
          </ModalFooter>
        </Modal>

        {/* Light Backdrop Modal */}
        <Modal
          isOpen={modals.lightBackdrop}
          onClose={() => closeModal('lightBackdrop')}
          backdropVariant="light"
        >
          <ModalHeader>
            <ModalTitle>Light Backdrop</ModalTitle>
            <ModalDescription>
              This modal uses a lighter backdrop for a more subtle overlay effect.
            </ModalDescription>
          </ModalHeader>
          <ModalBody>
            <p className="text-gray-600 dark:text-gray-300">
              The light backdrop creates a gentler visual separation while maintaining focus on the modal content.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => closeModal('lightBackdrop')}>
              Close
            </Button>
          </ModalFooter>
        </Modal>

        {/* Dark Backdrop Modal */}
        <Modal
          isOpen={modals.darkBackdrop}
          onClose={() => closeModal('darkBackdrop')}
          backdropVariant="dark"
        >
          <ModalHeader>
            <ModalTitle>Dark Backdrop</ModalTitle>
            <ModalDescription>
              This modal uses a darker backdrop for maximum focus and attention.
            </ModalDescription>
          </ModalHeader>
          <ModalBody>
            <p className="text-gray-600 dark:text-gray-300">
              The dark backdrop creates strong visual separation and draws maximum attention to the modal content.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => closeModal('darkBackdrop')}>
              Close
            </Button>
          </ModalFooter>
        </Modal>

        {/* No Close Button Modal */}
        <Modal
          isOpen={modals.noClose}
          onClose={() => closeModal('noClose')}
          showCloseButton={false}
          closeOnBackdropClick={false}
          closeOnEscape={false}
        >
          <ModalHeader>
            <ModalTitle>Action Required</ModalTitle>
            <ModalDescription>
              This modal requires an explicit action and cannot be dismissed by clicking outside or pressing escape.
            </ModalDescription>
          </ModalHeader>
          <ModalBody>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Please make a selection to continue. This modal demonstrates controlled closing behavior.
                  </p>
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={() => closeModal('noClose')}>
              Cancel
            </Button>
            <Button onClick={() => closeModal('noClose')}>
              Confirm
            </Button>
          </ModalFooter>
        </Modal>

        {/* Usage Example */}
        <Card className="mt-6 p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Usage Example
          </h2>

          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md">
            <pre className="text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
{`import { useTheme } from '@/hooks/useTheme'
import { CustomButton } from '@/components/ui/customButton'

const MyComponent = () => {
  const { isDark, toggleTheme, resolvedTheme } = useTheme()

  return (
    <div className="bg-white dark:bg-gray-900">
      <p>Current theme: {resolvedTheme}</p>
      <CustomButton
        variant="primary"
        onClick={toggleTheme}
      >
        {isDark ? 'Switch to Light' : 'Switch to Dark'}
      </CustomButton>
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