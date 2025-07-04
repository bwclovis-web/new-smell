import { cva, type VariantProps } from 'class-variance-authority'
export type ModalBackgroundVariant = VariantProps<typeof modalBackgroundVariant>
export type ModalContentVariant = VariantProps<typeof modalContentVariant>
export type ModalProps = ModalBackgroundVariant & ModalContentVariant

export const modalBackgroundVariant = cva(
  ['fixed w-full h-full z-20 transition-all top-0 '],
  {
    compoundVariants: [
      {
        animateStart: 'top',
        background: 'default',
        className: 'backdrop-blur-xs bg-atom-gray-22/50'
      }
    ],
    defaultVariants: {
      animate: false,
      background: 'default'
    },
    variants: {
      animate: {
        false: 'opacity-0',
        true: 'opacity-100 transition-all'
      },
      animateStart: {
        bottom: 'left-0',
        left: 'right-0',
        top: 'left-0'
      },
      background: {
        default: 'bg-noir-gold/50 backdrop-blur-xs',
        light: 'bg-white/80',
        purple: 'bg-purple-700/50'
      }
    }
  }
)

export const modalContentVariant = cva(
  ['fixed min-h-full lg:min-h-auto z-30 h-auto transition-all delay-200 pb-10 xl:p-8 pointer-none flex'],
  {
    compoundVariants: [
      {
        animate: false,
        animateStart: 'top',
        className: 'lg:-translate-y-80 h-0'
      },
      {
        animate: true,
        animateStart: 'top',
        className: 'lg:translate-y-40 delay-200 top-3 overflowY-auto'
      },
      {
        animate: false,
        animateStart: 'bottom',
        className: 'lg:translate-y-80 h-0'
      },
      {
        animate: true,
        animateStart: 'bottom',
        className: 'lg:translate-y-40 delay-200 top-3 overflowY-auto'
      },
      {
        animate: false,
        animateStart: 'left',
        className: 'lg:translate-x-[100%] h-0 h-full'
      },
      {
        animate: true,
        animateStart: 'left',
        className: 'lg:translate-x-[0%] delay-200'
      }
    ],
    defaultVariants: {
      animate: false,
      animateStart: 'top',
      innerType: 'default'
    },
    variants: {
      animate: {
        false: 'opacity-0',
        true: 'opacity-100 transition-animate shadow-2xl '
      },
      animateStart: {
        bottom: 'w-full lg:w-4/5 xl:w-2/5 duration-500 rounded',
        left: 'w-full lg:w-1/3 xl2:w-1/4 right-0 top-0 duration-300 h-full',
        top: 'w-full lg:w-4/5 xl:w-3/5 duration-500 rounded'
      },
      innerType: {
        default: 'bg-noir-light text-gray-900 p-4',
        light: 'bg-white',
        slate: 'bg-slate-800 text-slate-100'
      }
    }
  }
)
