<script lang="ts">
	import type { SourceDto, UpsertSourceDto } from '$lib/source/model';
	import { createEventDispatcher } from 'svelte';
	import type { InputValidator } from '../../shared/input';
	import { required } from '../../shared/validators';
	import { addSource, updateSource } from '$lib/source';
	import { Alert, Button, Spinner } from 'flowbite-svelte';
	import { CheckSolid } from 'flowbite-svelte-icons';
	import MultiSelect from '../../shared/MultiSelect.svelte';
	import Input from '../../shared/Input.svelte';
	import { getWords } from '$lib/word';

	export let source: SourceDto | null = null;
	const dispatch = createEventDispatcher();

	const invalidFormErrMsg = 'please fill in all required fields';
	let success = false;

	let form: UpsertSourceDto = {
		type: source?.type ?? '',
		content: source?.content ?? '',
		wordIds: source?.words.map((w) => w.id) ?? [],
	};

	let validators: Record<string, InputValidator> = {
		type: {
			fn: required,
			errMsg: '',
			isTouched: false,
		},
		content: {
			fn: required,
			errMsg: '',
			isTouched: false,
		},
	};

	$: {
		success = false;
		for (const entry of Object.entries(validators)) {
			const [key, validator] = entry;
			// @ts-ignore
			validator.errMsg = validator.fn(form[key as any]);
			validators = { ...validators, [key]: validator };
		}
	}

	$: err = Object.values(validators).some((v) => v.errMsg !== '' && v.isTouched)
		? invalidFormErrMsg
		: '';

	let isSubmitting = false;

	async function onSubmit(): Promise<void> {
		success = false;
		isSubmitting = true;
		err = '';
		if (Object.values(validators).some((v) => v.errMsg !== '')) {
			err = invalidFormErrMsg;
			isSubmitting = false;
			return;
		}

		let res = source ? await updateSource(source.id, form) : await addSource(form);
		isSubmitting = false;

		if (res) {
			dispatch('create');
			success = true;
		} else err = 'something went wrong';
	}
</script>

{#await getWords({ page: -1 })}
	<div class="flex h-32 items-center justify-center">
		<Spinner class="h-8 w-8 text-primary-500" />
	</div>
{:then list}
	<div class="flex flex-col gap-2">
		{#if source}
			<slot class="bg-neutral-800 text-white" name="detailMode" />
		{/if}
		<form class="flex flex-col" method="POST" on:submit|preventDefault>
			<div>
				<div class="mb-4 flex">
					<div class="flex-1">
						<Input
							disabled={isSubmitting}
							label="type*"
							bind:value={form.type}
							validator={validators.type}
						></Input>
					</div>
				</div>
				<div class="mb-4 flex">
					<div class="flex-1">
						<Input
							disabled={isSubmitting}
							label="content*"
							bind:value={form.content}
							validator={validators.content}
						></Input>
					</div>
				</div>
				<div class="mb-4">
					<MultiSelect
						disabled={isSubmitting}
						choices={(list ? list.items : []).map((w) => ({ value: w.id, name: w.content }))}
						label="words"
						bind:value={form.wordIds}
					></MultiSelect>
				</div>
			</div>
			<div class="flex flex-col">
				<Button
					disabled={isSubmitting || err}
					color="primary"
					outline
					size="xs"
					on:click={onSubmit}
				>
					{#if isSubmitting}
						<Spinner class="me-3" size="4" color="primary" />loading ...
					{:else}
						<CheckSolid></CheckSolid>
					{/if}
				</Button>
				{#if err}
					<Alert class="bg-neutral-800" color="none">
						<p class="underline decoration-red-900 decoration-wavy">{err}</p>
					</Alert>
				{/if}
				{#if success}
					<Alert class="bg-neutral-800" color="none">
						<p class="underline decoration-green-900 decoration-wavy">success</p>
					</Alert>
				{/if}
			</div>
		</form>
	</div>
{:catch error}
	<p style="color: red">{error.message}</p>
{/await}
