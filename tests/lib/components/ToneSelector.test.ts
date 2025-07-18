import type { ToneType } from '$lib/types'
import { describe, expect, it } from 'vitest'

// Create a mock model that simulates the ToneSelector component
class ToneSelectorModel {
    selectedTone: ToneType
    tones: ToneType[]
    onToneChange: (newTone: ToneType) => void

    constructor(
        initialSelectedTone: ToneType = 'gentle',
        initialTones: ToneType[] = ['gentle', 'funny', 'reassuring', 'concise']
    ) {
        this.selectedTone = initialSelectedTone
        this.tones = initialTones

        this.onToneChange = (newTone: ToneType): void => {
            this.selectedTone = newTone
        }
    }

    setSelectedTone(tone: ToneType): void {
        if (this.tones.includes(tone)) {
            this.selectedTone = tone
        } else {
            throw new Error(`Invalid tone: ${tone}`)
        }
    }

    isActive(tone: ToneType): boolean {
        return this.selectedTone === tone
    }
}

describe('ToneSelector Component', () => {
    it('should initialize with default values', () => {
        const component = new ToneSelectorModel()
        expect(component.selectedTone).toBe('gentle')
        expect(component.tones).toEqual(['gentle', 'funny', 'reassuring', 'concise'])
    })

    it('should initialize with provided values', () => {
        const component = new ToneSelectorModel('funny', ['funny', 'concise'])
        expect(component.selectedTone).toBe('funny')
        expect(component.tones).toEqual(['funny', 'concise'])
    })

    it('should change selected tone via onToneChange', () => {
        const component = new ToneSelectorModel()
        component.onToneChange('funny')
        expect(component.selectedTone).toBe('funny')
        expect(component.isActive('funny')).toBe(true)
    })

    it('should change selected tone via setSelectedTone', () => {
        const component = new ToneSelectorModel()
        component.setSelectedTone('concise')
        expect(component.selectedTone).toBe('concise')
        expect(component.isActive('concise')).toBe(true)
    })

    it('should throw when setting invalid tone via setSelectedTone', () => {
        const component = new ToneSelectorModel()
        expect(() => component.setSelectedTone('invalid' as ToneType)).toThrow(
            'Invalid tone: invalid'
        )
    })

    it('should correctly identify active tone', () => {
        const component = new ToneSelectorModel('funny')
        expect(component.isActive('funny')).toBe(true)
        expect(component.isActive('gentle')).toBe(false)
        expect(component.isActive('concise')).toBe(false)
    })

    it('should handle empty initialTones array', () => {
        const component = new ToneSelectorModel(undefined, [])
        expect(component.tones).toEqual([])
        expect(() => component.setSelectedTone('gentle' as ToneType)).toThrow(
            'Invalid tone: gentle'
        )
    })
})
