export default function getBinding() {
    const binding = val => {
        binding.value = val;
        binding.count++;
    };
    binding.value = null;
    binding.count = 0;
    return binding;
}